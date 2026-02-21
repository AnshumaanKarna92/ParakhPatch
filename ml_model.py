import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os
import warnings

# Suppress sklearn warnings if needed
warnings.filterwarnings("ignore")

MODEL_PATH = "pipeline_model.joblib"

class AnomalyDetector:
    def __init__(self):
        self.clf = None

    def train(self):
        print("Training Isolation Forest model on synthetic baseline data...")
        # Synthesize logic: Normal operation is T=40-42, V=0.2-0.3, H=45-55
        # Generate 2000 normal points
        temps = np.random.normal(loc=41.0, scale=1.5, size=2000)
        vibs = np.random.normal(loc=0.25, scale=0.05, size=2000)
        hums = np.random.normal(loc=50.0, scale=5.0, size=2000)
        
        X = np.column_stack((temps, vibs, hums))
        
        # Contamination=0.01 means we expect 1% anomalies
        self.clf = IsolationForest(contamination=0.01, random_state=42)
        self.clf.fit(X)
        
        joblib.dump(self.clf, MODEL_PATH)
        print(f"✓ Model saved to {MODEL_PATH}")

    def load(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.clf = joblib.load(MODEL_PATH)
                # Check feature count
                if self.clf.n_features_in_ != 3:
                    print("⚠️ Model feature count mismatch. Retraining...")
                    return False
                print(f"✓ Model loaded from {MODEL_PATH}")
                return True
            except:
                return False
        return False

    def predict(self, temp, vib, humidity):
        try:
            if self.clf is None:
                if not self.load():
                    print("⚠️ Model not found, retraining...")
                    self.train()
            
            X = np.array([[temp, vib, humidity]])
            raw_score = self.clf.decision_function(X)[0]
            risk = 1 / (1 + np.exp(15 * raw_score))
            final_risk = float(np.clip(risk, 0.0, 1.0))
            print(f"🧠 [ML] Inference: T={temp}, V={vib}, H={humidity} -> Risk={final_risk:.4f}")
            return final_risk
        except Exception as e:
            print(f"❌ ML PREDICT ERROR: {e}")
            return 0.5 # Default fallback risk

# Singleton instance for the pipeline to use
_detector = AnomalyDetector()

def get_risk_score(temp, vib, humidity):
    """
    Returns a probability-based risk score (0-1) using Isolation Forest.
    """
    return _detector.predict(temp, vib, humidity)

if __name__ == "__main__":
    _detector.train()
    # Sanity checks
    print(f"Test Normal (41°C, 0.25g, 50%): {_detector.predict(41, 0.25, 50):.4f}")
    print(f"Test Hot (55°C, 0.25g, 50%):    {_detector.predict(55, 0.25, 50):.4f}")
    print(f"Test Shake (41°C, 0.8g, 50%):   {_detector.predict(41, 0.80, 50):.4f}")
    print(f"Test Humid (41°C, 0.25g, 90%):  {_detector.predict(41, 0.25, 90):.4f}")
