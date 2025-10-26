import asyncio
from datetime import datetime, timezone
from bson import ObjectId
from database import db
from database import MONGO_URI
from main import StockData
from main import app
from pymongo import MongoClient, DESCENDING
import certifi
import uvicorn
from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query
import requests
import time
from scripts import scrape_prior_window
import json
from pathlib import Path
from analyzer import analyze_articles


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

@app.get("/analysis/stats")
async def get_analysis_stats():
    try:
        total_count = collection.count_documents({})
        favorites_count = collection.count_documents({"favorited": True})

        return {
            "totalAnalyses": total_count,
            "favoriteStocks": favorites_count
        }
    except Exception as e:
        print("❌ ERROR fetching analysis stats:", e)
        return {"error": str(e)}

@app.get("/analysis/recent")
async def get_recent_analyses(limit: int = 10):
    try:
        cursor = collection.find().sort("created_at", DESCENDING).limit(limit)
        results = []
        for doc in cursor:
            prediction = (doc.get("prediction") or "").lower()

            # ✅ Map prediction → recommendation
            if prediction == "increase":
                recommendation = "buy"
            elif prediction == "decrease":
                recommendation = "sell"
            else:
                recommendation = "hold"  # fallback if prediction missing or unclear


            results.append({
                "id": str(doc["_id"]),
                "symbol": doc.get("ticker"),
                "companyName": doc.get("company"),
                "summary": doc.get("summary"),
                "prediction": doc.get("prediction"),
                "recommendation": recommendation,  # ✅ now derived from prediction
                "keywords": doc.get("keywords"),
                "isFavorite": doc.get("favorited", False),
                "analysisDate": doc.get("created_at")
            })
        return results
    except Exception as e:
        print("❌ ERROR fetching recent analyses:", e)
        return {"error": str(e)}

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    try:
        data = request.model_dump()
        print("📩 Received data from frontend:", data)

        # Run the scraper synchronously and get its JSON result
        result_data = scrape_prior_window.run_scraper(
            data["symbol"],
            data["startDate"],
            data["endDate"]
        )

        print("🧠 Scraper finished. Now running Gemini analyzer...")

        # --- 2️⃣ Analyze result_data with Gemini ---
        analysis_output = analyze_articles(result_data)

        # --- 3️⃣ Build final structured Mongo document ---
        mongo_doc = {
            "ticker": result_data.get("ticker"),
            "company": result_data.get("company"),
            "start_date": result_data.get("start_date"),
            "end_date": result_data.get("end_date"),
            "net_gain": result_data.get("net_gain"),
            "label": result_data.get("label"),
            "prediction": analysis_output.get("prediction"),
            "created_at": datetime.now(timezone.utc).isoformat(),  # ISO 8601 UTC timestamp
            "favorited": False,  # all start as not favorited
            "summary": analysis_output.get("summary"),
            "keywords": analysis_output.get("keywords"),
            "articles": result_data.get("articles"),
        }

        # --- 4️⃣ Save to MongoDB ---
        insert_result = collection.insert_one(mongo_doc)
        mongo_doc["_id"] = str(insert_result.inserted_id)

        # --- 5️⃣ (Optional) Save to local file for debugging ---
        out_path = Path("last_result.json")
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(mongo_doc, f, indent=2, ensure_ascii=False)

        # --- 6️⃣ Return response ---
        return {
            "status": "success",
            "data": mongo_doc,
            "inserted_id": str(insert_result.inserted_id),
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("❌ ERROR running analyzer:", e)
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
