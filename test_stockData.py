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
from fastapi import FastAPI, Query
import requests
import time

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
async def search_stocks(q: str = Query(..., min_length=1), limit: int = 20):
    """
    Search for stocks using Yahoo Finance, with fallback mock data if rate-limited.
    """
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/119.0.0.0 Safari/537.36"
        )
    }

    # Mock fallback data (so your UI always works)
    fallback = [
        
        {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "GOOGL", "name": "Alphabet Inc. Class A", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "AMZN", "name": "Amazon.com, Inc.", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "META", "name": "Meta Platforms Inc.", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "NFLX", "name": "Netflix Inc.", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "JNJ", "name": "Johnson & Johnson", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "V", "name": "Visa Inc.", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "PG", "name": "Procter & Gamble Co.", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "UNH", "name": "UnitedHealth Group Inc.", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "HD", "name": "Home Depot Inc.", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "MA", "name": "Mastercard Inc.", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "DIS", "name": "Walt Disney Co.", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "PYPL", "name": "PayPal Holdings Inc.", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "ADBE", "name": "Adobe Inc.", "exchange": "NASDAQ", "type": "EQUITY"},
        {"symbol": "CRM", "name": "Salesforce Inc.", "exchange": "NYSE", "type": "EQUITY"},
        {"symbol": "INTC", "name": "Intel Corporation", "exchange": "NASDAQ", "type": "EQUITY"}
        
    ]

    for attempt in range(3):
        try:
            print(f"🌐 Attempt {attempt + 1}: Fetching {url}")
            response = requests.get(url, headers=headers, timeout=5)

            # Handle rate limit
            if response.status_code == 429:
                print("⚠️ Rate limited — waiting 2s before retry...")
                time.sleep(2)
                continue

            response.raise_for_status()
            data = response.json()
            quotes = data.get("quotes", [])[:limit]

            if not quotes:
                print("⚠️ No quotes found, returning fallback")
                return fallback

            results = []
            for item in quotes:
                if "symbol" in item and "shortname" in item:
                    results.append({
                        "symbol": item["symbol"],
                        "name": item["shortname"],
                        "exchange": item.get("exchange", "N/A"),
                        "type": item.get("quoteType", "N/A"),
                    })

            print(f"✅ Returning {len(results)} results to frontend")
            return results

        except Exception as e:
            print(f"❌ Error on attempt {attempt + 1}: {e}")
            time.sleep(1)

    # If all attempts fail, use fallback
    print("🚨 Yahoo unreachable, returning fallback data")
    return fallback

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
