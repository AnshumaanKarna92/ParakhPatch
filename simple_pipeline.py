import uvicorn
from fastapi import FastAPI, Request
from datetime import datetime
from pymongo import MongoClient
import ml_model
import os

# Configuration
MONGO_HOST = "localhost"
client = MongoClient(f"mongodb://{MONGO_HOST}:27017/")
db = client["predictive_maintenance"]
machines_col = db["machines"]

app = FastAPI()

# Load ML Model
print("Loading ML Model...")
ml_model.get_risk_score(40, 0.2, 50) # Warmup

@app.post("/v1/inputs/http_input")
async def ingest_pathway_style(request: Request):
    # Pathway often uses /v1/inputs/<table_name> but the connector might just use root or specific path.
    # In pipeline.py: pw.io.http.rest_connector(host="0.0.0.0", port=8081, schema=InputSchema)
    # Pathway default is usually POST /. Let's support root.
    data = await request.json()
    return process_data(data)

@app.post("/")
async def ingest_root(request: Request):
    data = await request.json()
    return process_data(data)

def process_data(data):
    try:
        # data might be a single dict or list of dicts (Pathway can accept batch)
        if isinstance(data, dict):
            items = [data]
        else:
            items = data
        
        for row in items:
            process_single_item(row)
        
        return {"status": "ok"}
    except Exception as e:
        print(f"Error processing: {e}")
        return {"status": "error", "message": str(e)}

def process_single_item(row):
    # Extract fields
    m_id = str(row.get("machine_id", "M01"))
    
    # STRICT FILTER: Only allow M01 (Real Hardware)
    if m_id not in ["M01"]:
        print(f"🚫 [PIPELINE] Ignored simulated/unknown machine: {m_id}")
        return

    temp = float(row.get("temperature", 0.0))
    vib = float(row.get("vibration", 0.0))
    hum = float(row.get("humidity", 0.0))
    rssi = int(row.get("signal_strength", -100))
    timestamp = row.get("timestamp")
    source = row.get("source", "REAL")

    # ML Scoring
    risk = ml_model.get_risk_score(temp, vib, hum)

    # Message Logic
    msg = "Status OK"
    if risk > 0.8:
        msg = f"🔴 CRITICAL: Risk {risk:.2f}!"
    elif risk > 0.4:
        msg = f"⚠️ WARNING: Risk {risk:.2f}."
    else:
        msg = f"✅ OPTIMAL (Risk {risk:.2f})."

    # Construct Document
    doc = {
        "machine_id": m_id,
        "temperature": temp,
        "vibration": vib,
        "humidity": hum,
        "signal_strength": rssi,
        "failure_risk": risk,
        "timestamp": datetime.now().isoformat(),
        "source": source,
        "message": msg
    }

    # Log
    print(f"💾 [MONGO] {m_id} Updated | Time: {doc['timestamp']} | Risk: {risk:.4f}")

    # Write to Mongo
    machines_col.update_one(
        {"machine_id": m_id},
        {"$set": doc},
        upsert=True
    )

if __name__ == "__main__":
    print("🚀 Starting Simple Pipeline (Windows Compatible) on Port 8081...")
    uvicorn.run(app, host="0.0.0.0", port=8081)
