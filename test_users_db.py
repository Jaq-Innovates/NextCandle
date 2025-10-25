from pymongo import MongoClient
import hashlib
import certifi
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Connect directly (sync)
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["nextcandle"]
users_collection = db["users"]

def test_user_insert():
    print("🚀 Testing MongoDB users collection...")

    user = {
        "first_name": "Dylan",
        "last_name": "goateeisfake",
        "email": "submissive@example.com",
        "phone": "670-670-6767",
        "username": "dylan_test",
        "password": hashlib.sha256("password123".encode()).hexdigest()
    }

    insert_result = users_collection.insert_one(user)
    print("✅ User inserted with ID:", insert_result.inserted_id)

    all_users = list(users_collection.find())
    print(f"📦 Found {len(all_users)} users in database:")
    for u in all_users:
        print(f"   - {u['username']} ({u['email']})")

if __name__ == "__main__":
    test_user_insert()
