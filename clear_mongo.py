from pymongo import MongoClient
try:
    client = MongoClient("mongodb://localhost:27017/") # WSL Local
    db = client["predictive_maintenance"]
    db["machines"].drop()
    print("✅ Collection 'machines' dropped.")
    print("Remaining count:", db["machines"].count_documents({}))
except Exception as e:
    print(e)
