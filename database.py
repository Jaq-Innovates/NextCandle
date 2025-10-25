import motor.motor_asyncio
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

#client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.nextcandle  # this is your database name

users_collection = db["users"]
stocks_collection = db["stocks"]