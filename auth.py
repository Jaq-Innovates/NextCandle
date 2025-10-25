# auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import users_collection
from bson import ObjectId
import hashlib

router = APIRouter()

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

class SignupModel(BaseModel):
    username: str
    email: str
    password: str

class LoginModel(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(user: SignupModel):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(user.password)
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed_pw
    }
    result = await users_collection.insert_one(new_user)
    return {"message": "Signup successful", "user_id": str(result.inserted_id)}

@router.post("/login")
async def login(user: LoginModel):
    hashed_pw = hash_password(user.password)
    existing = await users_collection.find_one({"email": user.email, "password": hashed_pw})
    if not existing:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful", "user_id": str(existing["_id"])}
