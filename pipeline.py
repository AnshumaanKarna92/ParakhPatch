import pathway as pw
from datetime import datetime
import os
from pymongo import MongoClient, UpdateOne
import ml_model
import socket

# Configuration
MONGO_AVAILABLE = False
machines_col = None

try:
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
    print(f"✅ Connected to MongoDB at {mongo_uri}")
    db = client["predictive_maintenance"]
    machines_col = db["machines"]
    MONGO_AVAILABLE = True
except Exception as e:
    print(f"⚠️ MONGO UNAVAILABLE: {e}")

# Define Schema corresponding to Ingestion output
# Mapped from Hardware: temp->temperature, etc.
class InputSchema(pw.Schema):
    machine_id: str
    temperature: float
    humidity: float
    vibration: float
    timestamp: int
    signal_strength: int
    server_time: str
    source: str

def build_pipeline():
    # 1. Ingest from HTTP
    data, *extra = pw.io.http.rest_connector(
        host="0.0.0.0",
        port=8081,
        schema=InputSchema,
        autocommit_duration_ms=1000
    )

    # 2. Windowing & Aggregation
    # Tumbling window of 5 seconds based on event timestamp
    windowed_stats = data.windowby(
        pw.this.timestamp,
        window=pw.temporal.tumbling(duration=5),
        instance=pw.this.machine_id
    ).reduce(
        machine_id=pw.reducers.max(pw.this.machine_id),
        avg_temp=pw.reducers.avg(pw.this.temperature),
        avg_vibration=pw.reducers.avg(pw.this.vibration),
        avg_humidity=pw.reducers.avg(pw.this.humidity),
        avg_rssi=pw.reducers.avg(pw.this.signal_strength),
        last_timestamp=pw.reducers.max(pw.this.timestamp),
        source=pw.reducers.max(pw.this.source)
    )

    # 3. ML Scoring (Isolation Forest with 3 features)
    def compute_risk(temp, vib, humidity):
        # Wrapper to handle potential None values safely (though reducers shouldn't produce None if data exists)
        t = temp if temp is not None else 0.0
        v = vib if vib is not None else 0.0
        h = humidity if humidity is not None else 0.0
        return ml_model.get_risk_score(t, v, h)

    scored_data = windowed_stats.select(
        pw.this.machine_id,
        pw.this.avg_temp,
        pw.this.avg_vibration,
        pw.this.avg_humidity,
        pw.this.avg_rssi,
        failure_risk=pw.apply(compute_risk, pw.this.avg_temp, pw.this.avg_vibration, pw.this.avg_humidity),
        timestamp=pw.this.last_timestamp,
        source=pw.this.source
    )

    # 4. Output to MongoDB
    def push_to_mongo(key, row, time, is_addition):
        if not MONGO_AVAILABLE:
            return
        
        if not is_addition:
            return

        try:
            # Row is a dictionary-like object
            doc = {
                "machine_id": row["machine_id"],
                "temperature": row["avg_temp"],
                "vibration": row["avg_vibration"],
                "humidity": row["avg_humidity"],
                "signal_strength": row["avg_rssi"],
                "failure_risk": row["failure_risk"],
                "timestamp": datetime.now().isoformat(),
                "source": row["source"],
                "message": "Status OK"
            }
            
            # Message logic
            if row["failure_risk"] > 0.8:
                doc["message"] = f"🔴 CRITICAL: Risk {row['failure_risk']:.2f}!"
            elif row["failure_risk"] > 0.4:
                doc["message"] = f"⚠️ WARNING: Risk {row['failure_risk']:.2f}."
            else:
                doc["message"] = f"✅ OPTIMAL (Risk {row['failure_risk']:.2f})."

            print(f"💾 [MONGO] {doc['machine_id']} Updated | Time: {doc['timestamp']} | Risk: {doc['failure_risk']:.2f}", flush=True)
            
            machines_col.update_one(
                {"machine_id": doc["machine_id"]},
                {"$set": doc},
                upsert=True
            )
        except Exception as e:
            print(f"⚠️ MONGO WRITE ERROR: {e}")

    pw.io.subscribe(scored_data, push_to_mongo)
    
    pw.run()

if __name__ == "__main__":
    build_pipeline()
