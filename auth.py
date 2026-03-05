# auth.py
# Handles user authentication - registration, login, session management
# Uses PBKDF2 hashing with salt for secure password storage

import json
import os
import hashlib
import secrets
from datetime import datetime

USERS_FILE = "data/users.json"

def ensure_data_folder():
    """Make sure data folder exists"""
    if not os.path.exists("data"):
        os.makedirs("data")

def generate_salt():
    """Generate a random salt for password hashing"""
    return secrets.token_hex(16)

def hash_password(password, salt):
    """
    Hash password using PBKDF2 with SHA-256
    PBKDF2 is industry standard for password hashing
    100,000 iterations makes brute force attacks very slow
    """
    return hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()

def generate_session_token():
    """Generate a secure random session token"""
    return secrets.token_hex(32)

def load_users():
    """Load all users from file"""
    ensure_data_folder()
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_users(users):
    """Save users to file"""
    ensure_data_folder()
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def validate_email(email):
    """Basic email validation"""
    if not email or '@' not in email or '.' not in email:
        return False
    parts = email.split('@')
    if len(parts) != 2:
        return False
    if len(parts[0]) < 1 or len(parts[1]) < 3:
        return False
    return True

def validate_password(password):
    """
    Check password meets security requirements
    Returns (is_valid, message)
    """
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    if not any(c.isalpha() for c in password):
        return False, "Password must contain at least one letter"
    return True, "Password is valid"

def create_account(username, email, password, confirm_password):
    """
    Create a new user account with validation
    Returns (success, message)
    """
    # Check all fields filled
    if not username or not email or not password:
        return False, "All fields are required"
    
    # Validate username
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if not username.isalnum():
        return False, "Username can only contain letters and numbers"
    
    # Validate email
    if not validate_email(email):
        return False, "Please enter a valid email address"
    
    # Validate password
    is_valid, msg = validate_password(password)
    if not is_valid:
        return False, msg
    
    # Check passwords match
    if password != confirm_password:
        return False, "Passwords do not match"
    
    # Check if username or email already exists
    users = load_users()
    username_lower = username.lower()
    
    if username_lower in users:
        return False, "Username is already taken"
    
    for user_data in users.values():
        if user_data.get('email', '').lower() == email.lower():
            return False, "An account with this email already exists"
    
    # Create the account
    salt = generate_salt()
    hashed = hash_password(password, salt)
    
    users[username_lower] = {
        'username_display': username,
        'email': email.lower(),
        'password_hash': hashed,
        'salt': salt,
        'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'last_login': None
    }
    
    save_users(users)
    return True, "Account created successfully!"

def check_login(username, password):
    """
    Verify login credentials
    Returns (success, session_token or error_message)
    """
    if not username or not password:
        return False, "Please enter username and password"
    
    users = load_users()
    username_lower = username.lower()
    
    if username_lower not in users:
        return False, "Invalid username or password"
    
    user = users[username_lower]
    salt = user['salt']
    hashed = hash_password(password, salt)
    
    if hashed != user['password_hash']:
        return False, "Invalid username or password"
    
    # Update last login
    users[username_lower]['last_login'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    save_users(users)
    
    # Generate session token
    token = generate_session_token()
    
    return True, token

def get_user_display_name(username):
    """Get the display name for a user"""
    users = load_users()
    username_lower = username.lower()
    if username_lower in users:
        return users[username_lower].get('username_display', username)
    return username

def get_user_email(username):
    """Get email for a user"""
    users = load_users()
    username_lower = username.lower()
    if username_lower in users:
        return users[username_lower].get('email', '')
    return ''