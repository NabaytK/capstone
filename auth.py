# auth.py
# Handles user authentication - login, signup, password storage
# Uses JSON file to store user data (simple approach for this project)

import json
import os
import hashlib

USERS_FILE = "users.json"

def hash_password(password):
    """
    Hash the password so we dont store plain text
    Using SHA-256 hash - not as good as bcrypt but simpler for this project
    """
    return hashlib.sha256(password.encode()).hexdigest()

def load_users():
    """Load all users from the JSON file"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_users(users):
    """Save users dictionary to JSON file"""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def check_login(username, password):
    """
    Check if username and password match
    Returns True if login is good, False if not
    """
    users = load_users()
    if username in users:
        # Compare hashed passwords
        hashed = hash_password(password)
        if users[username]['password'] == hashed:
            return True
    return False

def create_account(username, password):
    """
    Create a new user account
    Returns: (success: bool, message: string)
    """
    if not username or not password:
        return False, "Please fill in all fields"
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    
    if len(password) < 4:
        return False, "Password must be at least 4 characters"
    
    users = load_users()
    
    if username in users:
        return False, "Username already taken"
    
    # Save new user with hashed password
    users[username] = {
        'password': hash_password(password),
        'created': str(__import__('datetime').datetime.now())
    }
    save_users(users)
    
    return True, "Account created successfully!"

def user_exists(username):
    """Check if a username already exists"""
    users = load_users()
    return username in users