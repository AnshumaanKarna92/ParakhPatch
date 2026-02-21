from pymongo import MongoClient
try:
    client = MongoClient("mongodb://127.0.0.1:27017/")
    db = client["predictive_maintenance"]
    count = db["machines"].count_documents({})
    print(f"WSL Mongo Count: {count}")
    for doc in db["machines"].find():
        print(doc)
except Exception as e:
    print(e)
