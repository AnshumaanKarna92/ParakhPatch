import time
import random
import requests
import json
import math
from datetime import datetime

PATHWAY_URL = "http://localhost:8081/"

def wait_for_server():
    print(f"Waiting for Pathway Server at {PATHWAY_URL}...")
    for i in range(30):
        try:
            requests.get(PATHWAY_URL)
            print("Server is ONLINE!")
            return
        except requests.exceptions.ConnectionError:
            time.sleep(1)
            print(".", end="", flush=True)
    print("\nCould not connect to Pathway. Is 'pipeline.py' running?")

wait_for_server()

print(f"Starting Sensor Simulation -> Pushing to {PATHWAY_URL}")

machine_states = {}
ALPHA = 0.3  

def update_machine(machine_id, new_temp, new_vib, timestamp):
    if machine_id not in machine_states:
        machine_states[machine_id] = {'avg_temp': new_temp, 'avg_vib': new_vib}

    state = machine_states[machine_id]
    state['avg_temp'] = (ALPHA * new_temp) + ((1 - ALPHA) * state['avg_temp'])
    state['avg_vib'] = (ALPHA * new_vib) + ((1 - ALPHA) * state['avg_vib'])

    payload = {
        "machine_id": machine_id,
        "temperature": state['avg_temp'],
        "vibration": state['avg_vib'],
        "timestamp": timestamp
    }

    try:
        response = requests.post(PATHWAY_URL, json=payload)
        if response.status_code != 200:
            print(f"Failed to send: {response.status_code}")
        else:
            print(f"Sent Machine {machine_id}: Temp={state['avg_temp']:.2f}, Vib={state['avg_vib']:.2f}")
    except Exception as e:
        print(f"Connection Error: {e}")

def run_simulation():
    print("🛑 Simulation DISABLED via Antigravity Debugger.")
    # Do nothing
    while True:
        time.sleep(3600)

if __name__ == "__main__":
    run_simulation()
