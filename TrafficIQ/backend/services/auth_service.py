import hmac
import hashlib
import time
from functools import wraps
from flask import request, jsonify
from database.db_manager import get_connection, hash_password

SECRET_KEY = "trafficiq_authority_jwt_secret_token_2026"

def generate_token(username: str, role: str) -> str:
    """Generate a simple signed token for authority authentication."""
    expiry = int(time.time()) + 86400 * 7 # 7 days
    payload = f"{username}:{role}:{expiry}"
    sig = hmac.new(SECRET_KEY.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"

def verify_token(token: str):
    """Verify signed token and return (username, role) or None."""
    if not token:
        return None
    parts = token.split(':')
    if len(parts) != 4:
        return None
    username, role, expiry_str, sig = parts
    try:
        expiry = int(expiry_str)
        if time.time() > expiry:
            return None
    except ValueError:
        return None
    
    payload = f"{username}:{role}:{expiry_str}"
    expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()
    if hmac.compare_digest(sig, expected_sig):
        return {"username": username, "role": role}
    return None

def require_authority(f):
    """Decorator to require authority authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = ''
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
        elif auth_header:
            token = auth_header.strip()
        
        user_info = verify_token(token)
        if not user_info:
            return jsonify({
                "error": "Unauthorized. Official authority credentials required to access this endpoint."
            }), 401
        
        # Attach user info to request
        request.current_authority = user_info
        return f(*args, **kwargs)
    return decorated_function
