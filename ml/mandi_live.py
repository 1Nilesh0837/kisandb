# ============================================
# KisanDB — Live Mandi Price Integration
# Uses: data.gov.in Official Government API
# Run: python mandi_live.py
# ============================================

import requests
import pymongo
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import os

# ── CONFIG ────────────────────────────────────
DATA_GOV_API_KEY = "579b464db66ec23bdd000001868dadb49acb4e0953da81ba61271b4b"
MONGODB_URI = "mongodb+srv://nileshsahoo837_db_user:Nilesh123@cluster0.ahvm5f5.mongodb.net/kisandb?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME     = "kisandb"

# Official Government API
RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
BASE_URL    = f"https://api.data.gov.in/resource/{RESOURCE_ID}"
# ──────────────────────────────────────────────

client = pymongo.MongoClient(MONGODB_URI)
db     = client[DB_NAME]

app  = Flask(__name__)
CORS(app)

# Use absolute paths relative to the script location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ═══════════════════════════════════════════
#  CORE: Fetch from Government API
# ═══════════════════════════════════════════

def fetch_live_prices(commodity="Wheat", state=None, 
                      district=None, limit=100):
    """
    Fetch today's live prices from data.gov.in
    Official Agmarknet API — updated daily by govt
    """
    params = {
        "api-key": DATA_GOV_API_KEY,
        "format":  "json",
        "limit":   limit,
        "filters[commodity]": commodity,
    }

    if state:
        params["filters[state]"] = state
    if district:
        params["filters[district]"] = district

    try:
        print(f"🔄 Fetching live prices for {commodity}...")
        response = requests.get(
            BASE_URL, params=params, timeout=10
        )
        response.raise_for_status()
        data = response.json()

        records = data.get("records", [])
        print(f"✅ Got {len(records)} live records from API")
        return records

    except requests.exceptions.Timeout:
        print("⚠️  API timeout — using cached MongoDB data")
        return []
    except requests.exceptions.RequestException as e:
        print(f"⚠️  API error: {e} — using cached data")
        return []


def clean_api_record(record):
    """Standardize API response to our MongoDB schema (camelCase)"""
    def to_float(val):
        try:
            return float(str(val).replace(",", ""))
        except:
            return 0.0

    return {
        "crop":        record.get("commodity", ""),
        "state":       record.get("state", ""),
        "district":    record.get("district", ""),
        "mandi":       record.get("market", ""),
        "variety":     record.get("variety", ""),
        "grade":       record.get("grade", ""),
        "minPrice":    to_float(record.get("min_price", 0)),
        "maxPrice":    to_float(record.get("max_price", 0)),
        "modalPrice":  to_float(record.get("modal_price", 0)),
        "date":        datetime.now().strftime("%Y-%m-%d"),
        "unit":        "Rs./Quintal",
        "source":      "data.gov.in Live API",
        "fetchedAt":   datetime.now().isoformat(),
    }


def save_live_to_mongo(records):
    """Save live API records to MongoDB (upsert)"""
    if not records:
        return 0

    saved = 0
    for raw in records:
        record = clean_api_record(raw)

        if record["modalPrice"] <= 0:
            continue

        db.prices.update_one(
            {
                "crop":  record["crop"],
                "mandi": record["mandi"],
                "date":  record["date"],
            },
            {"$set": record},
            upsert=True,
        )
        saved += 1

    print(f"💾 Saved {saved} records to MongoDB")
    return saved


# ═══════════════════════════════════════════
#  ANALYSIS FUNCTIONS
# ═══════════════════════════════════════════

def get_todays_avg(commodity, state=None):
    """Get today's average price from MongoDB"""
    today  = datetime.now().strftime("%Y-%m-%d")
    match  = {"crop": commodity, "date": today}
    if state:
        match["state"] = state

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id":         None,
            "avgPrice":   {"$avg": "$modalPrice"},
            "minPrice":   {"$min": "$minPrice"},
            "maxPrice":   {"$max": "$maxPrice"},
            "totalMandis":{"$sum": 1},
        }}
    ]
    result = list(db.prices.aggregate(pipeline))
    if result:
        r = result[0]
        return {
            "avgPrice":    round(r["avgPrice"], 2),
            "minPrice":    round(r["minPrice"], 2),
            "maxPrice":    round(r["maxPrice"], 2),
            "totalMandis": r["totalMandis"],
        }
    return None


def get_nearby_mandis(commodity, state, limit=10):
    """Get prices from all mandis in a state — sorted best first"""
    today   = datetime.now().strftime("%Y-%m-%d")
    records = list(db.prices.find(
        {"crop": commodity, "state": state, "date": today},
        {"_id": 0, "mandi": 1, "district": 1,
         "modalPrice": 1, "minPrice": 1, "maxPrice": 1}
    ).sort("modalPrice", -1).limit(limit))

    return records


def get_highest_paying_mandi(commodity):
    """Find the single best-paying mandi across ALL states today"""
    today = datetime.now().strftime("%Y-%m-%d")

    result = db.prices.find_one(
        {"crop": commodity, "date": today,
         "modalPrice": {"$gt": 0}},
        sort=[("modalPrice", -1)]
    )

    if result:
        return {
            "mandi":       result["mandi"],
            "district":    result["district"],
            "state":       result["state"],
            "modalPrice": result["modalPrice"],
            "maxPrice":   result["maxPrice"],
        }
    return None


def get_state_comparison(commodity):
    """Compare average prices across all states today"""
    today = datetime.now().strftime("%Y-%m-%d")

    pipeline = [
        {"$match": {"crop": commodity, "date": today}},
        {"$group": {
            "_id":       "$state",
            "avgPrice": {"$avg": "$modalPrice"},
            "mandis":    {"$sum": 1},
        }},
        {"$sort": {"avgPrice": -1}},
        {"$limit": 10},
    ]
    results = list(db.prices.aggregate(pipeline))

    return [{
        "state":     r["_id"],
        "avgPrice": round(r["avgPrice"], 2),
        "mandis":    r["mandis"],
    } for r in results]


def get_price_change(commodity):
    """Calculate price change vs yesterday"""
    from datetime import timedelta

    today     = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    def avg_price(date):
        result = list(db.prices.aggregate([
            {"$match": {"crop": commodity, "date": date}},
            {"$group": {"_id": None, "avg": {"$avg": "$modalPrice"}}}
        ]))
        return round(result[0]["avg"], 2) if result else None

    today_price     = avg_price(today)
    yesterday_price = avg_price(yesterday)

    if today_price and yesterday_price:
        change    = today_price - yesterday_price
        change_pct = round((change / yesterday_price) * 100, 2)
        return {
            "today":      today_price,
            "yesterday":  yesterday_price,
            "change":     round(change, 2),
            "change_pct": change_pct,
            "trend":      "up" if change > 0 else "down",
        }
    return None


def generate_hindi_mandi_advice(commodity, highest, 
                                 state_compare, change):
    """Generate Hindi advice based on live mandi data"""
    crop_hindi = {
        "Wheat": "Gehu", "Rice": "Dhan",
        "Maize": "Makka", "Mustard": "Sarson",
        "Onion": "Pyaaz", "Tomato": "Tamatar",
    }.get(commodity, commodity)

    advice = []

    # Best mandi advice
    if highest:
        advice.append(
            f"🏆 Sabse zyada daam {highest['mandi']} "
            f"({highest['state']}) mein hai — "
            f"₹{highest['modalPrice']:.0f}/quintal!"
        )

    # Price trend advice
    if change:
        if change["change_pct"] > 2:
            advice.append(
                f"📈 {crop_hindi} ke daam kal se "
                f"{change['change_pct']}% badhey hain! "
                f"Aaj bechna accha rahega. 🎉"
            )
        elif change["change_pct"] < -2:
            advice.append(
                f"📉 {crop_hindi} ke daam kal se "
                f"{abs(change['change_pct'])}% girein hain. "
                f"Thoda rukna behtar ho sakta hai. ⏳"
            )
        else:
            advice.append(
                f"📊 {crop_hindi} ke daam aaj stable hain. "
                f"Naya daam: ₹{change['today']:.0f}/quintal."
            )

    # Best state advice
    if state_compare and len(state_compare) > 0:
        best_state = state_compare[0]
        advice.append(
            f"💡 {best_state['state']} mein sabse "
            f"zyada daam chal raha hai — "
            f"₹{best_state['avgPrice']:.0f}/quintal."
        )

    return " ".join(advice) if advice else (
        f"Aaj {crop_hindi} ka data update ho raha hai. "
        f"Thodi der mein check karein. 🔄"
    )


# ═══════════════════════════════════════════
#  FLASK ROUTES
# ═══════════════════════════════════════════

@app.route("/mandi/live", methods=["POST"])
def get_live_mandi():
    """
    Main endpoint — fetch live + analyze
    Body: { "commodity": "Wheat", "state": "Madhya Pradesh" }
    """
    try:
        data      = request.get_json()
        commodity = data.get("commodity", "Wheat")
        state     = data.get("state", None)

        # Step 1: Fetch fresh data from government API
        raw_records = fetch_live_prices(
            commodity=commodity, 
            state=state, 
            limit=200
        )

        # Step 2: Save to MongoDB
        if raw_records:
            save_live_to_mongo(raw_records)

        # Step 3: Analyze from MongoDB
        today_stats   = get_todays_avg(commodity, state)
        nearby_mandis = get_nearby_mandis(
            commodity, state or "Madhya Pradesh", limit=10
        )
        highest_mandi = get_highest_paying_mandi(commodity)
        state_compare = get_state_comparison(commodity)
        price_change  = get_price_change(commodity)

        # Step 4: Generate Hindi advice
        hindi_advice = generate_hindi_mandi_advice(
            commodity, highest_mandi, state_compare, price_change
        )

        return jsonify({
            "success":        True,
            "intent":         "mandi_info",
            "commodity":      commodity,
            "date":           datetime.now().strftime("%d %b %Y"),
            "todayStats":     today_stats,
            "nearbyMandis":   nearby_mandis,
            "highestMandi":   highest_mandi,
            "stateComparison": state_compare,
            "priceChange":    price_change,
            "advice":         hindi_advice,
            "live_records_fetched": len(raw_records),
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/mandi/today/<commodity>", methods=["GET"])
def today_prices(commodity):
    """Quick endpoint — today's prices for a crop"""
    state  = request.args.get("state")
    stats  = get_todays_avg(commodity, state)
    change = get_price_change(commodity)

    return jsonify({
        "commodity": commodity,
        "today":     stats,
        "change":    change,
    })


@app.route("/mandi/best/<commodity>", methods=["GET"])
def best_mandi(commodity):
    """Find highest paying mandi for a crop today"""
    highest = get_highest_paying_mandi(commodity)
    states  = get_state_comparison(commodity)

    return jsonify({
        "commodity":       commodity,
        "highest_mandi":   highest,
        "state_ranking":   states,
        "hindi":           (
            f"🏆 Aaj sabse zyada daam: "
            f"{highest['mandi']} ({highest['state']}) "
            f"₹{highest['modalPrice']:.0f}/qtl"
            if highest else "Data loading..."
        )
    })


@app.route("/mandi/refresh/<commodity>", methods=["GET"])
def refresh_data(commodity):
    """Manually trigger a fresh data fetch from govt API"""
    records = fetch_live_prices(commodity=commodity, limit=500)
    saved   = save_live_to_mongo(records)

    return jsonify({
        "commodity": commodity,
        "fetched":   len(records),
        "saved":     saved,
        "message":   f"✅ {commodity} data refreshed!",
        "timestamp": datetime.now().isoformat(),
    })


# ═══════════════════════════════════════════
#  AUTO-REFRESH: Every 6 hours automatically
# ═══════════════════════════════════════════

def auto_refresh():
    """Auto-fetch fresh prices every 6 hours"""
    crops = ["Wheat", "Rice", "Maize", "Mustard", "Onion"]
    print(f"\n🔄 Auto-refresh started at {datetime.now()}")
    for crop in crops:
        records = fetch_live_prices(commodity=crop, limit=500)
        if records:
            save_live_to_mongo(records)
        time.sleep(2)   # polite delay between requests
    print("✅ Auto-refresh complete!")


# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  KisanDB — Live Mandi Price Integration")
    print("  Data Source: data.gov.in (Official Govt API)")
    print("  Covers: 4,367 Mandis across India")
    print("  Running on: http://localhost:5001")
    print("=" * 55)

    # Initial data fetch on startup
    # print("\n⏳ Fetching initial live data...")
    # auto_refresh()

    app.run(debug=True, port=5001)
