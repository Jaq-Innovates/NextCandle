import asyncio
from bson import ObjectId
from database import db
from database import MONGO_URI
from main import StockData
from main import app
from pymongo import MongoClient
import certifi
import uvicorn
from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

collection = db.stocks  # matches your FastAPI route collection name

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
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
"""

# Define what the request should look like
class AnalysisRequest(BaseModel):
    symbol: str
    companyName: str
    startDate: str
    endDate: str

@app.get("/stocks/search")
async def search_stocks(q: str, limit: int = 20):
    # You can later connect this to a real API (e.g., Yahoo Finance)
    mock_stocks = [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "GOOG", "name": "Alphabet Inc."},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."}
    ]

    # simple filter by query
    results = [s for s in mock_stocks if q.lower() in s["name"].lower() or q.lower() in s["symbol"].lower()]
    return results[:limit]

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    try:
        data = request.model_dump()
        ##data["timestamp"] = datetime.utcnow()
        print("📩 Received data from frontend:", data)

        result = collection.insert_one(data)

        return {
            "status": "success",
            "inserted_id": str(result.inserted_id)
        }

    except Exception as e:
        import traceback
        print("❌ ERROR inserting into MongoDB:", e)
        traceback.print_exc()
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
