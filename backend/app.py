"""
StadiumIQ backend API.

Flask application providing AI-powered stadium operations support
for the FIFA World Cup 2026, including multilingual fan assistance,
staff briefing generation, crowd management intelligence, match
schedule data, and food ordering, via the Groq API and TheSportsDB.
"""

import os
import secrets
from functools import wraps

import requests
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import check_password_hash
from venues_data import VENUES
from groq import Groq
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

app = Flask(__name__)

IS_PRODUCTION = os.getenv("FLASK_ENV") == "production"

app.secret_key = os.getenv("SECRET_KEY")
if not app.secret_key:
    if IS_PRODUCTION:
        raise RuntimeError("SECRET_KEY environment variable is required in production")
    app.secret_key = secrets.token_hex(32)

app.config.update(
    SESSION_COOKIE_SAMESITE="None" if IS_PRODUCTION else "Lax",
    SESSION_COOKIE_SECURE=IS_PRODUCTION,
    SESSION_COOKIE_HTTPONLY=True,
)

CORS(
    app,
    origins=[
        "https://stadium-iq-six-lemon.vercel.app",
        "https://stadium-lvkxtnd2c-pushkar-workspace.vercel.app",
        "http://localhost:3000",
    ],
    supports_credentials=True,
)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://"
)

SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "ar": "Arabic",
    "pt": "Portuguese",
}

MAX_MESSAGE_LEN = 500
MAX_CONTEXT_LEN = 200

STAFF_USERNAME = os.getenv("STAFF_USERNAME", "admin")
STAFF_PASSWORD_HASH = os.getenv("STAFF_PASSWORD_HASH")

SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123"
WORLD_CUP_LEAGUE_ID = "4429"

FOOD_MENU = [
    {"id": "f1", "name": "Stadium Nachos", "category": "Snacks", "price": 12.50, "emoji": "🧀"},
    {"id": "f2", "name": "Classic Hot Dog", "category": "Snacks", "price": 8.00, "emoji": "🌭"},
    {"id": "f3", "name": "Margherita Pizza Slice", "category": "Snacks", "price": 9.50, "emoji": "🍕"},
    {"id": "f4", "name": "Chicken Tacos (3pc)", "category": "Meals", "price": 13.00, "emoji": "🌮"},
    {"id": "f5", "name": "Grilled Chicken Bowl", "category": "Meals", "price": 15.00, "emoji": "🍗"},
    {"id": "f6", "name": "Bottled Water", "category": "Drinks", "price": 4.00, "emoji": "💧"},
    {"id": "f7", "name": "Fountain Soda", "category": "Drinks", "price": 5.50, "emoji": "🥤"},
    {"id": "f8", "name": "Craft Lager", "category": "Drinks", "price": 11.00, "emoji": "🍺"},
    {"id": "f9", "name": "Soft-Serve Sundae", "category": "Desserts", "price": 7.00, "emoji": "🍨"},
]


def get_groq_client():
    """Return an initialised Groq client using the API key from the environment."""
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


def login_required(f):
    """Reject the request with 401 unless a staff session is active."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("staff_logged_in"):
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return wrapper


@app.before_request
def check_limiter():
    if app.config.get("TESTING", False):
        limiter.enabled = False
    else:
        limiter.enabled = True


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "running", "message": "StadiumIQ API is live!"})


@app.route("/api/venues", methods=["GET"])
def get_venues():
    return jsonify({"venues": VENUES})


@app.route("/api/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.json or {}
    username = str(data.get("username", "") or "").strip()
    password = data.get("password", "")
    if not isinstance(password, str):
        password = ""

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    if not STAFF_PASSWORD_HASH:
        return jsonify({"error": "Staff login is not configured on the server"}), 500
    if username != STAFF_USERNAME or not check_password_hash(STAFF_PASSWORD_HASH, password):
        return jsonify({"error": "Invalid username or password"}), 401

    session.clear()
    session["staff_logged_in"] = True
    session["staff_username"] = username
    return jsonify({"success": True, "username": username})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/session", methods=["GET"])
def get_session():
    return jsonify({
        "authenticated": bool(session.get("staff_logged_in")),
        "username": session.get("staff_username"),
    })


@app.route("/api/chat", methods=["POST"])
@limiter.limit("20 per minute")
def chat():
    data = request.json or {}
    message = str(data.get("message", "") or "").strip()
    language = data.get("language", "en")
    venue = str(data.get("venue", "") or "").strip()
    history = data.get("history", [])
    if not isinstance(history, list):
        history = []

    if not message:
        return jsonify({"error": "Message is required"}), 400
    if len(message) > MAX_MESSAGE_LEN:
        return jsonify({"error": f"Message must be {MAX_MESSAGE_LEN} characters or less"}), 400
    if language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": "Unsupported language. Use: en, es, fr, ar, pt"}), 400
    if venue and len(venue) > MAX_CONTEXT_LEN:
        return jsonify({"error": f"Venue must be {MAX_CONTEXT_LEN} characters or less"}), 400

    lang_name = SUPPORTED_LANGUAGES[language]
    venue_context = f" The fan is at {venue}." if venue else ""

    system_prompt = (
        f"You are StadiumIQ, an expert AI assistant for the FIFA World Cup 2026.{venue_context} "
        f"Help fans with navigation, food, schedules, accessibility, transport, and security. "
        f"You MUST respond ONLY in {lang_name}. Be concise, friendly, and accurate."
    )

    messages = [{"role": "system", "content": system_prompt}]
    for turn in history[-6:]:
        if not isinstance(turn, dict):
            continue
        if turn.get("role") in ("user", "assistant") and turn.get("content"):
            messages.append({"role": turn["role"], "content": str(turn["content"])[:500]})
    messages.append({"role": "user", "content": message})

    client = get_groq_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=400,
    )
    return jsonify({"response": response.choices[0].message.content.strip(), "language": language})


@app.route("/api/briefing", methods=["POST"])
@limiter.limit("10 per minute")
@login_required
def briefing():
    data = request.json or {}
    role = str(data.get("role", "") or "").strip()
    venue = str(data.get("venue", "") or "").strip()
    shift = str(data.get("shift", "") or "").strip()
    special_events = str(data.get("special_events", "") or "").strip()

    if not role or not venue or not shift:
        return jsonify({"error": "role, venue, and shift are required"}), 400
    if len(role) > 50:
        return jsonify({"error": "Role must be 50 characters or less"}), 400
    if len(venue) > MAX_CONTEXT_LEN:
        return jsonify({"error": f"Venue must be {MAX_CONTEXT_LEN} characters or less"}), 400
    if len(shift) > 50:
        return jsonify({"error": "Shift must be 50 characters or less"}), 400
    if len(special_events) > MAX_MESSAGE_LEN:
        return jsonify({"error": f"Special events must be {MAX_MESSAGE_LEN} characters or less"}), 400

    special_context = f"\nSpecial events/notes: {special_events}" if special_events else ""

    prompt = f"""Generate a professional pre-shift briefing for a FIFA World Cup 2026 stadium staff member.

Role: {role}
Venue: {venue}
Shift: {shift}{special_context}

Write a clear, structured briefing covering:
1. Key priorities for this shift
2. Important zones/areas to monitor
3. Common requests they will handle
4. Emergency protocols reminder
5. One motivational closing line

Keep it under 250 words. Be specific to their role and venue."""

    client = get_groq_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )
    return jsonify({
        "briefing": response.choices[0].message.content.strip(),
        "role": role,
        "venue": venue,
    })


@app.route("/api/crowd-advice", methods=["POST"])
@limiter.limit("15 per minute")
@login_required
def crowd_advice():
    data = request.json or {}
    venue = str(data.get("venue", "") or "").strip()
    zone = str(data.get("zone", "") or "").strip()
    incident = str(data.get("incident", "") or "").strip()

    if not venue or not zone:
        return jsonify({"error": "venue and zone are required"}), 400

    try:
        crowd_level = int(data.get("crowd_level", 5))
    except (ValueError, TypeError):
        return jsonify({"error": "crowd_level must be a valid number"}), 400

    if crowd_level < 1 or crowd_level > 10:
        return jsonify({"error": "crowd_level must be between 1 and 10"}), 400
    if len(venue) > MAX_CONTEXT_LEN:
        return jsonify({"error": f"Venue must be {MAX_CONTEXT_LEN} characters or less"}), 400
    if len(zone) > 100:
        return jsonify({"error": "Zone must be 100 characters or less"}), 400
    if len(incident) > MAX_MESSAGE_LEN:
        return jsonify({"error": f"Incident must be {MAX_MESSAGE_LEN} characters or less"}), 400

    density_label = (
        "low" if crowd_level <= 3
        else "moderate" if crowd_level <= 6
        else "high" if crowd_level <= 8
        else "critical"
    )
    incident_context = f"\nActive incident: {incident}" if incident else ""

    prompt = f"""You are a FIFA World Cup 2026 crowd management AI advisor.

Venue: {venue}
Zone: {zone}
Crowd density: {crowd_level}/10 ({density_label}){incident_context}

Provide immediate, actionable crowd management recommendations:
1. Immediate action (what to do RIGHT NOW)
2. Gate/flow adjustments
3. Staff deployment suggestions
4. Fan announcement text (short, clear, calm)
5. Escalation trigger (when to call for backup)

Be direct and operational. Under 200 words."""

    client = get_groq_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
    )
    return jsonify({
        "advice": response.choices[0].message.content.strip(),
        "venue": venue,
        "zone": zone,
        "crowd_level": crowd_level,
        "density_label": density_label,
    })


@app.route("/api/schedule", methods=["GET"])
@limiter.limit("30 per minute")
def schedule():
    try:
        next_res = requests.get(
            f"{SPORTSDB_BASE}/eventsnextleague.php",
            params={"id": WORLD_CUP_LEAGUE_ID},
            timeout=5,
        )
        past_res = requests.get(
            f"{SPORTSDB_BASE}/eventspastleague.php",
            params={"id": WORLD_CUP_LEAGUE_ID},
            timeout=5,
        )
        upcoming = (next_res.json() or {}).get("events") or []
        recent = (past_res.json() or {}).get("events") or []
    except (requests.RequestException, ValueError):
        return jsonify({"error": "Could not reach schedule data source"}), 502

    def format_event(e):
        has_score = e.get("intHomeScore") is not None and e.get("intAwayScore") is not None
        return {
            "id": e.get("idEvent"),
            "home_team": e.get("strHomeTeam"),
            "away_team": e.get("strAwayTeam"),
            "home_score": e.get("intHomeScore"),
            "away_score": e.get("intAwayScore"),
            "date": e.get("dateEvent"),
            "time": e.get("strTime"),
            "venue": e.get("strVenue"),
            "status": "Final" if has_score else "Scheduled",
            "round": e.get("intRound"),
        }

    return jsonify({
        "upcoming": [format_event(e) for e in upcoming[:10]],
        "recent": [format_event(e) for e in list(reversed(recent))[:10]],
    })


@app.route("/api/food/menu", methods=["GET"])
def food_menu():
    return jsonify({"menu": FOOD_MENU})


@app.route("/api/food/checkout", methods=["POST"])
@limiter.limit("10 per minute")
def food_checkout():
    data = request.json or {}
    cart = data.get("cart", [])
    venue = str(data.get("venue", "") or "").strip()

    if not cart or not isinstance(cart, list):
        return jsonify({"error": "Cart is empty"}), 400
    if len(cart) > 50:
        return jsonify({"error": "Cart has too many line items"}), 400

    menu_by_id = {item["id"]: item for item in FOOD_MENU}
    order_items = []
    total = 0.0

    for entry in cart:
        if not isinstance(entry, dict):
            continue
        item_id = entry.get("id")
        menu_item = menu_by_id.get(item_id)
        if not menu_item:
            continue
        try:
            qty = int(entry.get("quantity", 1))
        except (ValueError, TypeError):
            qty = 1
        qty = max(1, min(qty, 20))
        line_total = round(menu_item["price"] * qty, 2)
        total += line_total
        order_items.append({**menu_item, "quantity": qty, "line_total": line_total})

    if not order_items:
        return jsonify({"error": "No valid items in cart"}), 400

    order_number = f"SIQ-{secrets.token_hex(3).upper()}"
    return jsonify({
        "success": True,
        "order_number": order_number,
        "items": order_items,
        "total": round(total, 2),
        "venue": venue,
        "note": "Demo confirmation only — no real payment was processed.",
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)