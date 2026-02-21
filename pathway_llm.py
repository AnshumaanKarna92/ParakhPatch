import os
import sys
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = "groq/llama-3.3-70b-versatile"
TEMPERATURE = 0.7
PATHWAY_INSTALLED = False

try:
    import pathway as pw
    from pathway.xpacks.llm.llms import LiteLLMChat as RealLiteLLMChat
    PATHWAY_INSTALLED = True
    print("[Pathway] Using REAL Pathway engine.")
except ImportError:
    print("[Pathway] Windows shim active.")

if not PATHWAY_INSTALLED:
    try:
        from groq import Groq
        GROQ_AVAILABLE = True
    except ImportError:
        GROQ_AVAILABLE = False
        import requests
        import time

    class LiteLLMChat:
        def __init__(self, model="llama-3.3-70b-versatile", api_key=None, temperature=0.7, top_p=0.9):
            self.temperature = temperature
            self.top_p = top_p
            if GROQ_AVAILABLE:
                groq_key = os.getenv("GROQ_API_KEY") or api_key
                if groq_key:
                    self.client = Groq(api_key=groq_key)
                    self.model = "llama-3.3-70b-versatile" 
                    self.use_groq = True
                else:
                    self.use_groq = False
                    self.api_key = os.getenv("GOOGLE_API_KEY")
            else:
                self.use_groq = False
                self.api_key = os.getenv("GOOGLE_API_KEY")

        def __call__(self, prompt, **kwargs): return self.generate(prompt, **kwargs)

        def generate(self, prompt, max_retries=2):
            return self._generate_groq(prompt, max_retries) if self.use_groq else self._generate_gemini(prompt, max_retries)

        def _generate_groq(self, prompt, max_retries):
            print(f"🤖 [AI] Querying Groq ({self.model})...")
            try:
                response = self.client.chat.completions.create(
                    model=self.model.replace("groq/", ""),
                    messages=[{"role": "user", "content": prompt}],
                    temperature=self.temperature,
                    top_p=self.top_p,
                    max_tokens=2048
                )
                print("✅ [AI] Groq Success.")
                return response.choices[0].message.content
            except Exception as e: 
                print(f"❌ [AI] Groq Failed: {e}")
                return self._generate_gemini(prompt, max_retries)

        def _generate_gemini(self, prompt, max_retries):
            import requests, time
            models = ["gemini-2.0-flash", "gemini-1.5-flash"]
            for model_name in models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                for attempt in range(max_retries):
                    try:
                        response = requests.post(
                            url, headers={'Content-Type': 'application/json'},
                            json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=30
                        )
                        if response.status_code == 200:
                            return response.json()['candidates'][0]['content']['parts'][0]['text']
                    except: break
            return "AI service busy."

api_key = os.getenv("GROQ_API_KEY")

if PATHWAY_INSTALLED:
    llm_chat = RealLiteLLMChat(
        model=MODEL_NAME,
        temperature=TEMPERATURE,
        retry_strategy=pw.udfs.FixedDelayRetryStrategy(delay_ms=1000, max_retries=2),
        cache_strategy=pw.udfs.DefaultCache()
    )
else:
    llm_chat = LiteLLMChat(model=MODEL_NAME.replace("groq/", ""), api_key=api_key, temperature=TEMPERATURE)

class PathwayRAGService:
    def __init__(self, llm): self.llm = llm

    def answer(self, question, context, additional_context=""):
        prompt = f"""You are an industrial AI assistant. Answer efficiently.
Current Machine Data:
{context}
{additional_context}
User Question: {question}
Answer ONLY what is asked. Keep it brief."""
        
        if PATHWAY_INSTALLED:
            try: return self.llm.__wrapped__(prompt)
            except:
                import litellm
                resp = litellm.completion(model=MODEL_NAME, messages=[{"role": "user", "content": prompt}], temperature=TEMPERATURE)
                return resp.choices[0].message.content
        else: return self.llm(prompt)

    def generate_insights(self, context):
        prompt = f"""Analyze this machine data:
{context}
Provide: System Health, Critical Issues, At-Risk Machines, Actions, Maintenance, Energy Efficiency. Use bullet points."""
        
        if PATHWAY_INSTALLED:
            import litellm
            resp = litellm.completion(model=MODEL_NAME, messages=[{"role": "user", "content": prompt}], temperature=TEMPERATURE)
            return resp.choices[0].message.content
        else: return self.llm(prompt)

pathway_rag_service = PathwayRAGService(llm=llm_chat)
