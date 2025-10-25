import asyncio
from bson import ObjectId
from database import db
from database import MONGO_URI
from main import StockData
from pymongo import MongoClient
import certifi

collection = db.stocks  # matches your FastAPI route collection name

def test_database():
    
    print("🔍 Starting database test...")

    # ---------- CREATE TEST DATA ----------
    test_stock = StockData(
        username="dylan",
        company_name="Apple Inc.",
        ticker="AAPL",
        date="2025-10-25",
        prediction="Stock expected to rise due to strong iPhone sales.",
        keywords=["apple", "iphone", "growth"],
        summary="Analysts expect AAPL to increase after strong Q4 performance."
    )

    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client["NextCandleDB"]
    collection = db["stocks"]

    print("📝 Inserting test document...")
    test_stock = {"ticker": "mannyIsSmallAndWeak", "price": 67}

    insert_result = collection.insert_one(test_stock)
    print("✅ Inserted document ID:", insert_result.inserted_id)

if __name__ == "__main__":
    test_database()
