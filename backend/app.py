from flask import Flask, request, send_file, jsonify

from flask_cors import CORS
from PIL import Image
import numpy as np
import io
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import os
import hashlib
from collections import defaultdict, deque
import base64
from datetime import datetime, timedelta
import jwt
import secrets
from functools import wraps
from pymongo import MongoClient, ASCENDING
from passlib.hash import bcrypt

app = Flask(__name__)
# Allow the Next.js frontend (or configured origin) to call the API with fetch/FormData
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/stegabot")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me")  # must be overridden in env
JWT_EXP_MINUTES = int(os.environ.get("JWT_EXP_MINUTES", "60"))

# Mongo setup
mongo_client = MongoClient(MONGODB_URI, uuidRepresentation="standard")
db = mongo_client.get_default_database()
users_col = db.get_collection("users")
sessions_col = db.get_collection("auth_tokens")
convos_col = db.get_collection("conversations")
images_col = db.get_collection("images")

# Useful indexes
users_col.create_index([("email", ASCENDING)], unique=True)
sessions_col.create_index([("refresh_token_hash", ASCENDING)], unique=True)
convos_col.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
images_col.create_index([("hash", ASCENDING)], unique=True)

CORS(
    app,
    resources={r"/*": {"origins": [
        FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://localhost:3001",
    ]}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["X-Image-Hash"],
)

# Simple in-memory conversation store per user (bounded)
conversations = defaultdict(lambda: deque(maxlen=200))

# Key derivation parameters
PASS_SALT = os.environ.get("PASS_SALT", "stegabot-default-salt").encode()
PASS_ITERATIONS = int(os.environ.get("PASS_ITERATIONS", "200000"))
KDF = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=PASS_SALT,
    iterations=PASS_ITERATIONS,
    backend=default_backend(),
)

def derive_key(password: str) -> bytes:
    # Hash + stretch password; PBKDF2 is deterministic given the static salt and iterations
    return KDF.derive(password.encode())

def _log_chat(user: str, role: str, text: str, intent: str | None = None):
    user_key = user or "anonymous"
    conversations[user_key].append({
        "role": role,
        "text": text,
        "intent": intent,
    })

# ----------------- Security Helpers -----------------
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB limit
STORAGE_DIR = os.environ.get("STORAGE_DIR", os.path.join(os.getcwd(), "storage"))
os.makedirs(STORAGE_DIR, exist_ok=True)


def _hash_password(password: str) -> str:
    return bcrypt.hash(password)


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password, hashed)


def _create_access_token(user_id: str, email: str):
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        print(f"[AUTH DEBUG] Authorization header: '{auth_header[:50]}...' (len={len(auth_header)})" if auth_header else "[AUTH DEBUG] No Authorization header")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization required"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.user = {"id": payload.get("sub"), "email": payload.get("email")}
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return fn(*args, **kwargs)
    return wrapper

def is_safe_file(file):
    if not file or not hasattr(file, "filename") or not file.filename:
        return False, "No file provided."

    # Check extension
    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, "Unsupported file type. Use PNG or JPG only."

    # Check size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # reset pointer
    if size > MAX_FILE_SIZE:
        return False, f"File too large ({size/1024:.1f} KB). Limit is 5MB."

    return True, None

# ----------------- Encryption -----------------
def _derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=120_000,
        backend=default_backend()
    )
    return kdf.derive(password.encode())


def encrypt_message_with_password(message: str, password: str) -> bytes:
    """
    Encrypts message using AES-256-CBC with PBKDF2-derived key.
    Layout of returned bytes: salt (16) | iv (16) | ciphertext
    """
    salt = os.urandom(16)
    key = _derive_key(password, salt)
    padder = padding.PKCS7(128).padder()
    padded_message = padder.update(message.encode()) + padder.finalize()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted_message = encryptor.update(padded_message) + encryptor.finalize()
    return salt + iv + encrypted_message


def decrypt_message_with_password(encrypted_payload: bytes, password: str) -> str:
    """
    Reverses encrypt_message_with_password; expects salt|iv|ciphertext.
    """
    if len(encrypted_payload) < 32:
        raise ValueError("Encrypted payload too short")
    salt = encrypted_payload[:16]
    iv = encrypted_payload[16:32]
    ciphertext = encrypted_payload[32:]
    key = _derive_key(password, salt)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_message = decryptor.update(ciphertext) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    message = unpadder.update(decrypted_message) + unpadder.finalize()
    return message.decode()

# ----------------- Steganography -----------------
def encode_message(image, encrypted_payload: bytes):
    # Length-prefix the payload to avoid terminator collisions inside ciphertext.
    # Layout in the image: payload_len (4 bytes, big endian) | payload
    payload = len(encrypted_payload).to_bytes(4, 'big') + encrypted_payload
    binary_message = ''.join(format(byte, '08b') for byte in payload)
    data = np.array(image)

    if len(binary_message) > data.size:
        raise ValueError("Message too long to hide in this image.")

    index = 0
    for value in np.nditer(data, op_flags=['readwrite']):
        if index < len(binary_message):
            value[...] = (value & 0xFE) | int(binary_message[index])
            index += 1

    return Image.fromarray(data)


def decode_message(image):
    data = np.array(image)
    bits = []

    # Need at least 32 bits to read the length prefix
    it = np.nditer(data)
    for _ in range(32):
        try:
            v = next(it)
        except StopIteration:
            return None
        bits.append(str(int(v) & 1))

    payload_len = int(''.join(bits), 2)
    if payload_len <= 0:
        return None

    # Then read payload_len bytes
    needed_bits = payload_len * 8
    bits = []
    for _ in range(needed_bits):
        try:
            v = next(it)
        except StopIteration:
            return None
        bits.append(str(int(v) & 1))

    payload_bytes = bytes(
        int(''.join(bits[i:i + 8]), 2) for i in range(0, len(bits), 8)
    )
    return payload_bytes

# ----------------- Routes -----------------
@app.route('/')
def index():
    return jsonify({
        "status": "ok",
        "service": "stegabot-backend",
        "version": "2.0.0",
        "features": [
            "AES-256-CBC Encryption",
            "LSB Steganography",
            "Steganalysis Detection",
            "Shareable Decode Links"
        ],
        "endpoints": [
            "/register",
            "/login",
            "/encode-message",
            "/decode-message",
            "/analyze-capacity",
            "/detect-steganography",
            "/share",
            "/image-histogram",
        ],
    })

@app.route('/encode', methods=['POST'])
def encode():
    # Legacy route kept for backward compatibility; uses new secure handler with anonymous user
    request.user = {"id": None, "email": None}
    return encode_message_secure()

@app.route('/decode', methods=['POST'])
def decode():
    request.user = {"id": None, "email": None}
    return decode_message_secure()


# ----------------- Auth Routes -----------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    display_name = (data.get("display_name") or email.split("@")[0]).strip() or "User"
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if users_col.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400
    hashed_pw = _hash_password(password)
    user_doc = {
        "email": email,
        "hashed_password": hashed_pw,
        "display_name": display_name,
        "created_at": datetime.utcnow(),
    }
    result = users_col.insert_one(user_doc)
    token = _create_access_token(str(result.inserted_id), email)
    return jsonify({"access_token": token, "display_name": display_name}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = users_col.find_one({"email": email})
    if not user or not _verify_password(password, user["hashed_password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = _create_access_token(str(user["_id"]), email)
    refresh_token = secrets.token_urlsafe(32)
    refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    sessions_col.insert_one({
        "user_id": str(user["_id"]),
        "refresh_token_hash": refresh_hash,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=7),
    })
    display_name = user.get("display_name") or email.split("@")[0]
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "display_name": display_name,
        "welcome": f"Welcome {display_name}!",
    }), 200


# ----------------- Secure Encode/Decode -----------------
def _save_image_bytes(byte_data: bytes) -> str:
    sha256 = hashlib.sha256(byte_data).hexdigest()
    path = os.path.join(STORAGE_DIR, f"{sha256}.png")
    with open(path, "wb") as f:
        f.write(byte_data)
    return sha256


@app.route('/encode-message', methods=['POST'])
@_auth_required
def encode_message_secure():
    file = request.files.get('imageInput')
    message = request.form.get('messageInput', '').strip()
    password = request.form.get('passwordInput', '')

    if not file or not message or not password:
        return jsonify({"error": "Image, message, and password are required."}), 400

    # Safety checks
    safe, error = is_safe_file(file)
    if not safe:
        return jsonify({"error": error}), 400

    image = Image.open(file)
    # Strip EXIF/metadata by re-saving into a clean Image
    image_no_exif = Image.new(image.mode, image.size)
    image_no_exif.putdata(list(image.getdata()))
    # Compute integrity hash of the original upload bytes
    file.seek(0)
    original_bytes = file.read()
    file.seek(0)
    sha256_original = hashlib.sha256(original_bytes).hexdigest()
    try:
        encrypted_payload = encrypt_message_with_password(message, password)
        encoded_image = encode_message(image_no_exif.convert("RGB"), encrypted_payload)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    img_byte_arr = io.BytesIO()
    encoded_image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    encoded_bytes = img_byte_arr.getvalue()

    stored_hash = _save_image_bytes(encoded_bytes)
    image_doc = {
        "owner_id": request.user.get("id"),
        "hash": stored_hash,
        "upload_hash": sha256_original,
        "created_at": datetime.utcnow(),
    }
    images_col.insert_one(image_doc)

    conv_doc = {
        "user_id": request.user.get("id"),
        "type": "encode",
        "encrypted_message": base64.b64encode(encrypted_payload).decode(),
        "password_hash": _hash_password(password),
        "image_hash": stored_hash,
        "created_at": datetime.utcnow(),
    }
    convos_col.insert_one(conv_doc)

    resp = send_file(io.BytesIO(encoded_bytes), mimetype='image/png', as_attachment=True, download_name='hidden_data_image.png')
    resp.headers['X-Image-Hash'] = sha256_original
    return resp


@app.route('/decode-message', methods=['POST'])
@_auth_required
def decode_message_secure():
    file = request.files.get('encodedImageInput')
    password = request.form.get('passwordInput', '')

    if not file or not password:
        return jsonify({"error": "Encoded image and password are required."}), 400

    safe, error = is_safe_file(file)
    if not safe:
        return jsonify({"error": error}), 400

    uploaded_bytes = file.read()
    file.seek(0)
    upload_hash = hashlib.sha256(uploaded_bytes).hexdigest()

    # Note: We allow decoding any image as long as the password is correct.
    # The encryption itself provides the security - without the password, 
    # the message cannot be decrypted.

    image = Image.open(io.BytesIO(uploaded_bytes))
    encrypted_payload = decode_message(image.convert("RGB"))
    if not encrypted_payload:
        return jsonify({"message": "Image does not contain a valid encoded payload"}), 400
    try:
        message = decrypt_message_with_password(encrypted_payload, password)
    except Exception:
        return jsonify({"message": "Wrong password or image is not encoded"}), 400

    conv_doc = {
        "user_id": request.user.get("id"),
        "type": "decode",
        "status": "success",
        "image_hash": upload_hash,
        "password_hash": _hash_password(password),
        "message_hash": hashlib.sha256(message.encode()).hexdigest(),
        "created_at": datetime.utcnow(),
    }
    convos_col.insert_one(conv_doc)

    return jsonify({"decodedMessage": message})


@app.route('/conversations', methods=['GET'])
@_auth_required
def conversations():
    user_id = request.user.get("id")
    items = []
    for conv in convos_col.find({"user_id": user_id}).sort("created_at", ASCENDING):
        items.append({
            "image_hash": conv.get("image_hash"),
            "created_at": conv.get("created_at"),
            "encrypted_message": conv.get("encrypted_message"),
            "type": conv.get("type", "encode"),
            "status": conv.get("status", "stored"),
        })
    return jsonify({"conversations": items})

# ----------------- Chat & Security -----------------
@app.after_request
def set_security_headers(resp):
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "no-referrer"
    # Minimal CSP allowing self static
    resp.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'"
    # Expose custom headers used by the frontend (image integrity hash)
    resp.headers["Access-Control-Expose-Headers"] = "X-Image-Hash"
    return resp

def _chat_reply(intent: str, text: str):
    intent = (intent or "").lower()
    if intent == "encode":
        return {"reply": "To encode: choose an image, type your secret message, and a strong password, then click 'Scan + Encode'.", "actions": "focus-encode"}
    if intent == "decode":
        return {"reply": "To decode: pick the encoded image and enter the password used to encode, then click 'Scan + Decode'.", "actions": "focus-decode"}
    if intent == "help":
        return {"reply": "I can help with encoding/decoding hidden messages. Say 'encode' or 'decode'. You can also ask about security policy.", "actions": None}
    if intent == "policy":
        return {"reply": "Security: AES-256 (CBC) with password-derived keys, client and server validation, 5MB limit, PNG/JPG only. Keep passwords long and unique.", "actions": None}
    return {"reply": "I didn't catch that. Try 'encode' or 'decode'.", "actions": None}

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json(silent=True) or {}
    msg = data.get('message', '')
    intent = data.get('intent', '')
    user = data.get('user') or "anonymous"
    _log_chat(user, "user", msg, intent)
    reply = _chat_reply(intent, msg)
    _log_chat(user, "bot", reply.get("reply", ""), intent)
    return jsonify(reply)

@app.route('/chat/history', methods=['GET'])
def chat_history():
    user = request.args.get('user') or "anonymous"
    return jsonify({"user": user, "messages": list(conversations.get(user, []))})

@app.route('/verify_image', methods=['POST'])
def verify_image():
    file = request.files.get('image')
    expected = request.form.get('expectedHash', '')
    if not file or not expected:
        return jsonify({"ok": False, "message": "Image and expectedHash required."}), 400

    # Safety: reuse size/type checks
    safe, error = is_safe_file(file)
    if not safe:
        return jsonify({"ok": False, "message": error}), 400

    file.seek(0)
    data = file.read()
    file.seek(0)
    actual = hashlib.sha256(data).hexdigest()
    return jsonify({"ok": actual == expected, "actual": actual, "expected": expected})


# ----------------- NEW: Image Capacity Calculator -----------------
@app.route('/analyze-capacity', methods=['POST'])
def analyze_capacity():
    """Calculate how many characters can be hidden in an image."""
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Image required"}), 400
    
    safe, error = is_safe_file(file)
    if not safe:
        return jsonify({"error": error}), 400
    
    image = Image.open(file)
    data = np.array(image.convert("RGB"))
    
    # Total pixels * 3 channels = total bits available
    total_bits = data.size
    # Subtract 32 bits for length prefix, divide by 8 for bytes
    available_bytes = (total_bits - 32) // 8
    # AES adds ~48 bytes overhead (16 salt + 16 IV + padding)
    usable_chars = max(0, available_bytes - 48)
    
    return jsonify({
        "width": image.width,
        "height": image.height,
        "total_pixels": image.width * image.height,
        "max_characters": usable_chars,
        "max_words": usable_chars // 5,  # Rough estimate
        "encryption": "AES-256-CBC with PBKDF2 (120,000 iterations)"
    })


# ----------------- NEW: Steganalysis Detection -----------------
def _chi_square_attack(data: np.ndarray) -> tuple[float, float]:
    """
    Perform chi-square attack on LSB plane.
    Returns (chi_square_statistic, p_value approximation).
    High chi-square with low p-value indicates NO steganography.
    Low chi-square suggests uniform distribution = steganography likely.
    """
    flat = data.flatten().astype(np.int32)
    
    # Create pairs of values (2i, 2i+1) that differ only in LSB
    # PoV (Pairs of Values) analysis
    even_vals = flat & 0xFE  # Clear LSB
    
    # Count histogram of even values
    hist = np.bincount(even_vals, minlength=256)
    
    # For each pair (2k, 2k+1), expected frequency should be equal
    # after LSB embedding (random data makes them equal)
    chi_sq = 0.0
    n_pairs = 0
    
    for k in range(0, 256, 2):
        h0 = hist[k]      # Count of value k (even)
        h1 = hist[k + 1]  # Count of value k+1 (odd)
        total = h0 + h1
        if total > 0:
            expected = total / 2.0
            chi_sq += ((h0 - expected) ** 2 + (h1 - expected) ** 2) / expected
            n_pairs += 1
    
    # Approximate p-value using chi-square distribution
    # Lower chi-square = more uniform = more likely stego
    return chi_sq, n_pairs


def _rs_analysis(data: np.ndarray, sample_size: int = 10000) -> float:
    """
    Simplified RS (Regular-Singular) analysis.
    Returns estimated message length ratio (0-1).
    """
    flat = data.flatten()
    if len(flat) < sample_size:
        sample = flat
    else:
        # Random sampling for speed
        indices = np.random.choice(len(flat), sample_size, replace=False)
        sample = flat[indices]
    
    # Group into blocks of 4
    n_blocks = len(sample) // 4
    if n_blocks == 0:
        return 0.0
    
    blocks = sample[:n_blocks * 4].reshape(-1, 4)
    
    # Discrimination function: sum of absolute differences
    def discriminant(b):
        return np.sum(np.abs(np.diff(b, axis=1)), axis=1)
    
    # Original discrimination
    d_orig = discriminant(blocks)
    
    # Flip LSB
    flipped = blocks ^ 1
    d_flipped = discriminant(flipped)
    
    # Count regular (R), singular (S), unchanged (U)
    r_m = np.sum(d_flipped > d_orig)
    s_m = np.sum(d_flipped < d_orig)
    
    # Negative flipping (flip LSB of odd values only)
    neg_flip = blocks.copy()
    neg_flip[:, 1::2] ^= 1
    d_neg = discriminant(neg_flip)
    
    r_neg = np.sum(d_neg > d_orig)
    s_neg = np.sum(d_neg < d_orig)
    
    # RS analysis formula
    # If R_m ≈ R_{-m} and S_m ≈ S_{-m}, likely no stego
    # If they differ significantly, stego present
    
    if n_blocks > 0:
        rm_ratio = r_m / n_blocks
        sm_ratio = s_m / n_blocks
        rn_ratio = r_neg / n_blocks
        sn_ratio = s_neg / n_blocks
        
        # Difference indicates embedding
        diff = abs(rm_ratio - rn_ratio) + abs(sm_ratio - sn_ratio)
        return min(1.0, diff * 2)  # Scale to 0-1
    
    return 0.0


def _sample_pair_analysis(data: np.ndarray, sample_size: int = 50000) -> float:
    """
    Sample Pair Analysis (SPA) for more accurate detection.
    Returns probability of steganography (0-1).
    """
    flat = data.flatten()
    
    if len(flat) < 100:
        return 0.0
    
    # Sample for speed
    if len(flat) > sample_size:
        indices = np.random.choice(len(flat) - 1, sample_size, replace=False)
    else:
        indices = np.arange(len(flat) - 1)
    
    # Analyze consecutive pixel pairs
    p1 = flat[indices]
    p2 = flat[indices + 1]
    
    # Count close pairs (differ by 1)
    close_pairs = np.sum(np.abs(p1.astype(int) - p2.astype(int)) == 1)
    close_ratio = close_pairs / len(indices)
    
    # In natural images, close pairs are common (~15-25%)
    # After LSB embedding, this ratio changes predictably
    # Very high close_ratio (>30%) or very uniform distribution suggests stego
    
    # Also check LSB correlation
    lsb1 = p1 & 1
    lsb2 = p2 & 1
    
    # Natural images have correlated LSBs
    # Random stego data breaks correlation
    correlation = np.mean(lsb1 == lsb2)
    
    # Natural images: correlation ~0.55-0.7
    # Stego images: correlation ~0.5 (random)
    if 0.48 < correlation < 0.52:
        return 0.8  # Very suspicious
    elif 0.45 < correlation < 0.55:
        return 0.5  # Suspicious
    
    return 0.2


@app.route('/detect-steganography', methods=['POST'])
def detect_steganography():
    """
    Advanced steganalysis using multiple detection methods:
    1. Chi-square attack
    2. RS Analysis  
    3. Sample Pair Analysis
    4. Header detection (StegaBot-specific)
    5. LSB entropy analysis
    """
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Image required"}), 400
    
    safe, error = is_safe_file(file)
    if not safe:
        return jsonify({"error": error}), 400
    
    image = Image.open(file).convert("RGB")
    data = np.array(image)
    flat = data.flatten()
    
    detection_score = 0
    reasons = []
    analysis_details = {}
    
    # ===== Method 1: Chi-Square Attack (fast, vectorized) =====
    chi_sq, n_pairs = _chi_square_attack(data)
    # Lower chi-square = more uniform = stego likely
    # Normalize: natural images have high chi-sq (>1000), stego has low (<100)
    chi_normalized = chi_sq / max(n_pairs, 1)
    analysis_details["chi_square"] = round(chi_normalized, 2)
    
    if chi_normalized < 1.0:
        detection_score += 25
        reasons.append(f"Chi-square analysis indicates uniform LSB distribution ({chi_normalized:.2f})")
    elif chi_normalized < 5.0:
        detection_score += 10
        reasons.append(f"Chi-square shows slight uniformity ({chi_normalized:.2f})")
    
    # ===== Method 2: RS Analysis (accurate) =====
    rs_score = _rs_analysis(data)
    analysis_details["rs_score"] = round(rs_score, 3)
    
    if rs_score > 0.6:
        detection_score += 20
        reasons.append(f"RS analysis detects embedding artifacts ({rs_score:.1%})")
    elif rs_score > 0.3:
        detection_score += 10
        reasons.append(f"RS analysis shows slight anomalies ({rs_score:.1%})")
    
    # ===== Method 3: Sample Pair Analysis =====
    spa_score = _sample_pair_analysis(data)
    analysis_details["spa_score"] = round(spa_score, 3)
    
    if spa_score > 0.6:
        detection_score += 15
        reasons.append(f"Sample pair analysis suspicious ({spa_score:.1%})")
    
    # ===== Method 4: LSB Entropy (fast, vectorized) =====
    # Extract LSBs and calculate byte-level entropy
    lsb_bits = flat & 1
    n_samples = min(len(lsb_bits), 80000)
    sample_bits = lsb_bits[:n_samples - (n_samples % 8)]
    
    # Convert bits to bytes
    lsb_bytes = np.packbits(sample_bits)
    
    # Calculate entropy using histogram
    byte_hist = np.bincount(lsb_bytes, minlength=256)
    byte_probs = byte_hist / len(lsb_bytes)
    byte_probs = byte_probs[byte_probs > 0]
    entropy = -np.sum(byte_probs * np.log2(byte_probs))
    
    analysis_details["lsb_entropy"] = round(entropy, 2)
    
    if entropy > 7.9:
        detection_score += 20
        reasons.append(f"Very high LSB entropy ({entropy:.2f}/8.0) - encrypted data likely")
    elif entropy > 7.5:
        detection_score += 10
        reasons.append(f"High LSB entropy ({entropy:.2f}/8.0)")
    
    # ===== Method 5: StegaBot Header Detection (definitive) =====
    try:
        # Read first 32 bits as length prefix
        header_bits = lsb_bits[:32]
        if len(header_bits) == 32:
            payload_len = int(''.join(str(b) for b in header_bits), 2)
            max_possible = (data.size - 32) // 8
            
            # Valid StegaBot header check
            if 32 <= payload_len <= max_possible and payload_len < 10_000_000:
                # Additional validation: check if payload length is reasonable
                # AES encrypted data is always 32+ bytes (salt + IV + data)
                if payload_len >= 48:
                    detection_score += 30
                    reasons.append(f"Valid StegaBot header found (payload: {payload_len:,} bytes)")
                    analysis_details["detected_payload_bytes"] = payload_len
    except Exception:
        pass
    
    # ===== Method 6: LSB Ratio =====
    lsb_zeros = np.sum(lsb_bits == 0)
    lsb_ones = len(lsb_bits) - lsb_zeros
    lsb_ratio = lsb_zeros / len(lsb_bits)
    analysis_details["lsb_ratio"] = round(lsb_ratio, 4)
    
    # Perfect 50/50 is suspicious
    if 0.498 < lsb_ratio < 0.502:
        detection_score += 10
        reasons.append(f"LSB ratio extremely uniform ({lsb_ratio:.4f})")
    
    # ===== Final Verdict =====
    # Cap at 100
    detection_score = min(100, detection_score)
    
    if detection_score >= 70:
        verdict = "HIGHLY LIKELY CONTAINS HIDDEN DATA"
        confidence = "very high"
    elif detection_score >= 50:
        verdict = "LIKELY CONTAINS HIDDEN DATA"
        confidence = "high"
    elif detection_score >= 30:
        verdict = "POSSIBLY CONTAINS HIDDEN DATA"
        confidence = "medium"
    elif detection_score >= 15:
        verdict = "UNLIKELY TO CONTAIN HIDDEN DATA"
        confidence = "low"
    else:
        verdict = "NO HIDDEN DATA DETECTED"
        confidence = "very low"
    
    return jsonify({
        "verdict": verdict,
        "confidence": confidence,
        "score": detection_score,
        "max_score": 100,
        "analysis": analysis_details,
        "reasons": reasons,
        "methods_used": [
            "Chi-Square Attack",
            "RS Analysis", 
            "Sample Pair Analysis",
            "LSB Entropy",
            "Header Detection",
            "LSB Ratio"
        ]
    })


# ----------------- NEW: Shareable Decode Links -----------------
shared_images = {}  # In production, use Redis or MongoDB

@app.route('/share', methods=['POST'])
@_auth_required
def create_share_link():
    """Create a shareable link for an encoded image."""
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Encoded image required"}), 400
    
    safe, error = is_safe_file(file)
    if not safe:
        return jsonify({"error": error}), 400
    
    file.seek(0)
    image_bytes = file.read()
    
    # Generate unique share ID
    share_id = secrets.token_urlsafe(8)
    
    # Store in memory (use MongoDB in production)
    shared_images[share_id] = {
        "image": base64.b64encode(image_bytes).decode(),
        "created_by": request.user.get("email"),
        "created_at": datetime.utcnow().isoformat(),
        "views": 0
    }
    
    return jsonify({
        "share_id": share_id,
        "share_url": f"/share/{share_id}",
        "message": "Share this link with the recipient. They'll need the password to decode."
    })


@app.route('/share/<share_id>', methods=['GET'])
def get_shared_image(share_id):
    """Get a shared image for decoding."""
    if share_id not in shared_images:
        return jsonify({"error": "Share link not found or expired"}), 404
    
    shared_images[share_id]["views"] += 1
    
    return jsonify({
        "share_id": share_id,
        "image_base64": shared_images[share_id]["image"],
        "created_at": shared_images[share_id]["created_at"],
        "views": shared_images[share_id]["views"]
    })


@app.route('/share/<share_id>/decode', methods=['POST'])
def decode_shared_image(share_id):
    """Decode a shared image without authentication."""
    if share_id not in shared_images:
        return jsonify({"error": "Share link not found or expired"}), 404
    
    password = request.form.get('password', '')
    if not password:
        return jsonify({"error": "Password required"}), 400
    
    # Decode the image
    image_bytes = base64.b64decode(shared_images[share_id]["image"])
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    encrypted_payload = decode_message(image)
    if not encrypted_payload:
        return jsonify({"message": "Image does not contain valid encoded data"}), 400
    
    try:
        message = decrypt_message_with_password(encrypted_payload, password)
        return jsonify({"decodedMessage": message})
    except Exception:
        return jsonify({"message": "Wrong password"}), 400


# ----------------- NEW: Get Image Histogram for Comparison -----------------
@app.route('/image-histogram', methods=['POST'])
def get_image_histogram():
    """Get histogram data for image comparison visualization."""
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Image required"}), 400
    
    image = Image.open(file).convert("RGB")
    data = np.array(image)
    
    # Calculate histograms for R, G, B channels
    histograms = {
        "red": np.histogram(data[:,:,0].flatten(), bins=256, range=(0,256))[0].tolist(),
        "green": np.histogram(data[:,:,1].flatten(), bins=256, range=(0,256))[0].tolist(),
        "blue": np.histogram(data[:,:,2].flatten(), bins=256, range=(0,256))[0].tolist(),
    }
    
    # Calculate LSB histogram
    lsb_data = data & 1
    histograms["lsb"] = {
        "zeros": int(np.sum(lsb_data == 0)),
        "ones": int(np.sum(lsb_data == 1))
    }
    
    return jsonify({
        "width": image.width,
        "height": image.height,
        "histograms": histograms
    })


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
 