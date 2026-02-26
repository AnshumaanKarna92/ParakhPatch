from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import requests
import json
import time
import math
import random
from pathway_llm import pathway_rag_service

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["predictive_maintenance"]
machines_col = db["machines"]
insights_col = db["insights"]

api_key = os.getenv("GOOGLE_API_KEY")

class DirectGeminiModel:
    def __init__(self, api_key):
        self.api_key = api_key

    def generate_content(self, prompt):
        models = ["gemini-2.0-flash", "gemini-1.5-flash"]
        last_error = None
        class ResponseWrapper:
            def __init__(self, text): self.text = text

        for model_name in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            for attempt in range(3):
                try:
                    response = requests.post(
                        url, 
                        headers={'Content-Type': 'application/json'}, 
                        json={"contents": [{"parts": [{"text": prompt}]}]}
                    )
                    if response.status_code == 200:
                        try:
                            return ResponseWrapper(response.json()['candidates'][0]['content']['parts'][0]['text'])
                        except: return ResponseWrapper("Error parsing AI response.")
                    elif response.status_code == 429:
                        time.sleep(2**attempt)
                        continue
                    else:
                        last_error = f"AI Error ({response.status_code})"
                        break
                except Exception as e:
                    last_error = str(e)
                    break
        return ResponseWrapper(last_error or "AI unavailable.")

class MockModel:
    def generate_content(self, prompt):
        class Mock: text = "AI unavailable. Check API Key."
        return Mock()

if not api_key:
    print("Warning: GOOGLE_API_KEY not found.")
    model = MockModel()
else:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-pro")
    except:
        model = DirectGeminiModel(api_key)

if not model: model = MockModel()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

_synthetic_t = 0

def _gen_synthetic():
    global _synthetic_t
    _synthetic_t += 1
    t = _synthetic_t
    temp = 68 + 12 * math.sin(t / 15) + (random.random() - 0.5) * 4
    vib  = 0.35 + 0.18 * abs(math.sin(t / 8)) + (random.random() - 0.5) * 0.06
    hum  = 44 + 8 * math.cos(t / 20) + (random.random() - 0.5) * 2
    rssi = -58 + random.randint(-5, 5)
    risk = min(0.95, max(0.02, (temp - 60) / 60 + vib / 1.5 - 0.1 + (random.random() - 0.5) * 0.05))
    if risk > 0.8:
        msg = f"🔴 CRITICAL: Risk {risk*100:.0f}%!"
    elif risk > 0.4:
        msg = f"⚠️ WARNING: Risk {risk*100:.0f}%."
    else:
        msg = f"✅ OPTIMAL (Risk {risk*100:.0f}%)."
    return {
        "machine_id": "M01",
        "temperature": round(temp, 1),
        "avg_temp": round(temp, 1),
        "vibration": round(vib, 3),
        "avg_vibration": round(vib, 3),
        "humidity": round(hum, 1),
        "avg_humidity": round(hum, 1),
        "signal_strength": rssi,
        "avg_rssi": rssi,
        "failure_risk": round(risk, 3),
        "timestamp": datetime.now().isoformat(),
        "source": "SYNTHETIC",
        "message": msg
    }

def get_machine_context():
    return "Current Status:\n" + "\n".join([
        f"Machine {m['machine_id']}: Temp {m['avg_temp']}C, Vib {m['avg_vibration']}g, Risk {m['failure_risk']*100}%, Status: {m['message']}"
        for m in list(machines_col.find({}, {"_id": 0}))
    ])

@app.get("/")
def root(): return {"status": "API running"}

@app.get("/health")
def health(): return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/machines")
def get_machines():
    data = list(machines_col.find({"machine_id": "M01"}, {"_id": 0}))
    print(f"📡 [API] /machines called. Returning {len(data)} records (M01 Only).")
    if not data:
        # Hardware not connected — return synthetic demo data
        print("🧩 [API] No real data found. Returning synthetic demo record.")
        return [_gen_synthetic()]
    return data

@app.post("/explain")
def explain(alert: dict = Body(...)):
    print(f"📡 [API] /explain called for alert: {alert.get('id')}")
    try:
        if isinstance(model, MockModel):
            # Fallback to Pathway/Groq
            context = get_machine_context()
            prompt = f"Explain this alert in the context of the current system: {alert}"
            answer = pathway_rag_service.answer(prompt, context)
            return {"explanation": answer}
        return {"explanation": model.generate_content(f"Explain alert: {alert}").text}
    except Exception as e: 
        print(f"❌ [API] explain failed: {e}")
        return {"explanation": str(e)}

@app.post("/insights/generate")
def generate_insights():
    print("📡 [API] /insights/generate called")
    try:
        context = get_machine_context()
        analysis = pathway_rag_service.generate_insights(context)
        insight = {
            "timestamp": datetime.now().isoformat(),
            "analysis": analysis,
            "machines_analyzed": machines_col.count_documents({})
        }
        insights_col.insert_one(insight)
        insight.pop("_id", None)
        return {"success": True, "insight": insight}
    except Exception as e: 
        print(f"❌ [API] generate_insights failed: {e}")
        return {"success": False, "error": str(e)}

@app.get("/insights/latest")
def get_latest_insight():
    print("📡 [API] /insights/latest called")
    insight = insights_col.find_one({}, {"_id": 0}, sort=[("timestamp", -1)])
    if insight: insight.pop("_id", None)
    return {"success": True, "insight": insight} if insight else {"success": False, "message": "No insights"}

@app.post("/insights/rag")
def rag_query(query: dict = Body(...)):
    print(f"📡 [API] /insights/rag called with question: {query.get('question')}")
    try:
        context = get_machine_context()
        recent = list(insights_col.find({}, {"_id": 0, "analysis": 1}).sort("timestamp", -1).limit(3))
        history = "\n".join([r['analysis'][:200] for r in recent])
        answer = pathway_rag_service.answer(query.get("question", ""), context, history)
        print("✅ [API] RAG answer generated.")
        return {
            "success": True, 
            "answer": answer
        }
    except Exception as e: 
        print(f"❌ [API] rag_query failed: {e}")
        return {"success": False, "error": str(e)}

@app.post("/report/generate")
def generate_report():
    print("📡 [API] /report/generate called")
    try:
        context = get_machine_context()
        if isinstance(model, MockModel):
            content = pathway_rag_service.answer("Generate a detailed maintenance report for these machines.", context)
        else:
            content = model.generate_content(f"Generate maintenance report for: {context}").text
            
        report = {
            "timestamp": datetime.now().isoformat(),
            "content": content,
            "machines_count": machines_col.count_documents({})
        }
        db["reports"].insert_one(report)
        report.pop("_id", None)
        return {"success": True, "report": report}
    except Exception as e: 
        print(f"❌ [API] generate_report failed: {e}")
        return {"success": False, "error": str(e)}

@app.get("/report/latest")
def get_latest_report():
    report = db["reports"].find_one({}, {"_id": 0}, sort=[("timestamp", -1)])
    if report: report.pop("_id", None)
    return {"success": True, "report": report} if report else {"success": False, "message": "No reports"}