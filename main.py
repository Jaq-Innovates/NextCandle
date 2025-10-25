from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from auth import signup_user, login_user
from database import db

app = FastAPI(title="NextCandle Backend")

# ---------- MODELS ----------
class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class StockData(BaseModel):
    username: str
    company_name: str
    ticker: str
    date: str
    prediction: str
    keywords: List[str]
    summary: str

# ---------- AUTH ROUTES ----------
@app.post("/signup")
async def signup(user: UserSignup):
    try:
        res = signup_user(user.email, user.password)
        return {"message": "Signup successful", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
async def login(user: UserLogin):
    try:
        res = login_user(user.email, user.password)
        return {"message": "Login successful", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------- MONGODB ROUTES ----------
@app.post("/add_stock")
async def add_stock(stock: StockData):
    try:
        result = await db.stocks.insert_one(stock.dict())
        return {"message": "Stock data added", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_stocks/{username}")
async def get_stocks(username: str):
    try:
        stocks = await db.stocks.find({"username": username}).to_list(100)
        return {"username": username, "count": len(stocks), "stocks": stocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "database": "connected"}
