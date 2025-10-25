# main.py
from fastapi import FastAPI
from auth import router as auth_router
from database import stocks_collection
from pydantic import BaseModel
from typing import List

app = FastAPI(title="NextCandle API")

app.include_router(auth_router, prefix="/auth")

class StockData(BaseModel):
    username: str
    company_name: str
    ticker: str
    date: str
    prediction: str
    keywords: List[str]
    summary: str

@app.post("/add_stock")
async def add_stock(stock: StockData):
    stock_dict = stock.dict()
    result = await stocks_collection.insert_one(stock_dict)
    return {"message": "Stock added", "id": str(result.inserted_id)}

@app.get("/get_stocks/{username}")
async def get_stocks(username: str):
    stocks = await stocks_collection.find({"username": username}).to_list(100)
    return stocks
