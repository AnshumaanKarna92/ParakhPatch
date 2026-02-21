from pymongo import MongoClient
from datetime import datetime
import time
import random

# Connect to MongoDB on Windows
client = MongoClient("mongodb://localhost:27017/")
db = client["predictive_maintenance"]
machines_col = db["machines"]

print("✓ Connected to MongoDB")
print("Starting live data generator...")

# Generate live, changing data
machine_count = 3
iteration = 0

while True:
    iteration += 1
    print(f"\n[Update #{iteration}] Generating new data...")
    
    for machine_id in range(machine_count):
        # Generate random but realistic data
        base_temp = 35 + (machine_id * 3)
        base_vib = 0.2 + (machine_id * 0.1)
        
        # Add randomness
        temp = base_temp + random.uniform(-5, 10)
        vib = base_vib + random.uniform(-0.1, 0.3)
        
        # Calculate risk
        if temp > 45:
            risk = 0.9
            message = f"⚠️ CRITICAL: Temperature spike ({temp:.1f}°C). Check cooling system immediately!"
        elif temp > 40:
            risk = 0.5
            message = f"⚠️ WARNING: Elevated readings (Temp: {temp:.1f}°C, Vib: {vib:.2f}g). Schedule maintenance."
        else:
            risk = 0.1
            message = "✓ Operating normally."
        
        # Update MongoDB
        doc = {
            "machine_id": machine_id,
            "avg_temp": temp,
            "avg_vibration": vib,
            "failure_risk": risk,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        machines_col.update_one(
            {"machine_id": machine_id},
            {"$set": doc},
            upsert=True
        )
        
        print(f"  Machine {machine_id}: Temp={temp:.1f}°C, Vib={vib:.2f}g, Risk={risk:.1f}")
    
    print(f"✓ Updated {machine_count} machines in MongoDB")
    time.sleep(2)  # Update every 2 seconds
