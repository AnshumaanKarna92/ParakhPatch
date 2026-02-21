import aiohttp
import asyncio
import json
import time
import os

# Configuration
# HARDWARE_URL = "https://optical-readers-graphics-northeast.trycloudflare.com/stream"
# PATHWAY_URL = "http://localhost:8081/"

HARDWARE_URL = os.getenv("STREAM_URL", "https://optical-readers-graphics-northeast.trycloudflare.com/stream")
PATHWAY_URL = "http://localhost:8081/"
POLL_INTERVAL = 5

import asyncio

if os.name == 'nt':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def fetch_real_data(session):
    try:
        async with session.get(HARDWARE_URL, timeout=4) as response:
            if response.status == 200:
                text = await response.text()
                data = json.loads(text)
                return data
            else:
                print(f"⚠️ Hardware Status: {response.status}")
                return None
    except Exception as e:
        print(f"⚠️ Hardware Unreachable: {e}")
        return None

async def run_ingestion():
    print(f"🚀 Starting STRICT Ingestion Engine (M01 Only)...")
    print(f"📡 Source: {HARDWARE_URL}")
    print(f"🛑 Simulation: DISABLED")
    
    last_timestamp = 0
    
    async with aiohttp.ClientSession() as session:
        while True:
            start_time = time.time()
            
            # 1. Fetch
            real_data = await fetch_real_data(session)
            
            if real_data:
                try:
                    # Handle list response
                    if isinstance(real_data, list):
                        if len(real_data) == 0:
                            print("⚠️ Empty list from hardware")
                            continue
                        # Get the LATEST packet (last item in the list)
                        real_data = real_data[-1]

                    # 2. Map Schema (Hardware -> System)
                    # Input: { "machine_id": "M01", ... }
                    
                    m_id = str(real_data.get("machine_id", "M01"))
                    temp = float(real_data.get("temp", 0.0))
                    hum = float(real_data.get("humidity", 0.0))
                    vib = float(real_data.get("vibration", 0.0))
                    rssi = int(real_data.get("rssi", -100))
                    
                    raw_ts = real_data.get("timestamp", 0)
                    try:
                        hw_ts = int(raw_ts)
                    except ValueError:
                        print(f"⚠️ Invalid timestamp format: {raw_ts}")
                        hw_ts = 0

                    server_time = str(real_data.get("server_time", ""))

                    print(f"📥 [FETCHED] {real_data}")
                    print(f"🕒 Timestamp: {hw_ts} (Raw: {raw_ts})")

                    if hw_ts == 0:
                        print("⚠️ Timestamp is 0! Data might be rejected as duplicate if it doesn't change.")

                    status = "DUPLICATE"
                    if hw_ts > last_timestamp:
                        status = "NEW"
                        last_timestamp = hw_ts
                    
                    print(f"🔍 Status: {status} (Current: {hw_ts} > Last: {last_timestamp})")

                    if status == "NEW":
                        payload = {
                            "machine_id": m_id,
                            "temperature": temp,
                            "humidity": hum,
                            "vibration": vib,
                            "timestamp": int(time.time()), # Use Ingestion Time for consistent windowing
                            "signal_strength": rssi,
                            "server_time": server_time,
                            "source": "REAL"
                        }
                        
                        print(f"🟢 [INGEST] Packet: {m_id} | T:{temp}C H:{hum}% V:{vib}g RSSI:{rssi}")
                        
                        # 3. Push to Pipeline
                        async with session.post(PATHWAY_URL, json=payload, timeout=3) as resp:
                            if resp.status == 200:
                                pass # Silent success
                            else:
                                print(f"❌ Pathway Error {resp.status}")
                    else:
                        print("⏭️ Skipping duplicate packet.")
                            
                except Exception as e:
                    print(f"❌ Parse/Send Error: {e}")
            else:
                print("⏳ Waiting for hardware stream...", end="\r")

            # Wait
            elapsed = time.time() - start_time
            sleep_time = max(0, POLL_INTERVAL - elapsed)
            await asyncio.sleep(sleep_time)

if __name__ == "__main__":
    try:
        asyncio.run(run_ingestion())
    except KeyboardInterrupt:
        print("Stopped.")
