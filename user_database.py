from database import users_collection
import hashlib

def create_user(first_name, last_name, email, phone, username, password):
    existing_user = users_collection.find_one({"username": username})
    if existing_user:
        return {"error": "Username already exists"}

    hashed_pw = hashlib.sha256(password.encode()).hexdigest()

    user_doc = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "username": username,
        "password": hashed_pw
    }

    users_collection.insert_one(user_doc)
    return {"message": "✅ User created successfully"}

def verify_user(username, password):
    hashed_pw = hashlib.sha256(password.encode()).hexdigest()
    user = users_collection.find_one({"username": username})
    if not user:
        return {"error": "User not found"}
    if user["password"] != hashed_pw:
        return {"error": "Incorrect password"}
    return {"message": "✅ Login successful", "user": user}
