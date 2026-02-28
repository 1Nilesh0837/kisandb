# ============================================
# KisanDB - Step 3: Flask API Server
# Run: python step3_api_server.py
# Runs on: http://localhost:5000
# ============================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
import pickle
import os
import glob
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# ── CONFIG ────────────────────────────────────
MONGODB_URI = "mongodb+srv://nileshsahoo837_db_user:Nilesh123@cluster0.ahvm5f5.mongodb.net/kisandb?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME       = "kisandb"
MODELS_FOLDER = "./models"
PORT          = 5000
# ──────────────────────────────────────────────

app    = Flask(__name__)
CORS(app)

client = pymongo.MongoClient(MONGODB_URI)
db     = client[DB_NAME]

# Change to script directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

def load_model(crop):
    """Load saved model for a crop"""
    filename = os.path.join(MODELS_DIR, f"{crop.replace(' ', '_')}_model.pkl")
    if not os.path.exists(filename):
        return None
    with open(filename, "rb") as f:
        return pickle.load(f)


def generate_hindi_advice(crop, predictions, best):
    """Generate Hindi advice based on prediction trend"""
    first_price = predictions[0]["predicted_price"]
    last_price  = predictions[-1]["predicted_price"]
    trend       = last_price - first_price

    crop_hindi = {
        "Wheat": "Gehu", "Rice": "Dhan",
        "Maize": "Makka", "Mustard": "Sarson"
    }.get(crop, crop)

    if trend < -50:
        return (
            f"⚠️ {crop_hindi} ke daam tezi se gir rahe hain! "
            f"{best['date']} ko ₹{best['predicted_price']:.0f}/quintal milega. "
            f"Jitna jaldi becho, utna achha! Intezaar mat karo. 🚨"
        )
    elif trend < 0:
        return (
            f"📉 {crop_hindi} ke daam thoda neeche ja rahe hain. "
            f"{best['date']} ko bechna best rahega — "
            f"₹{best['predicted_price']:.0f}/quintal expected. 💡"
        )
    elif trend > 50:
        return (
            f"🚀 {crop_hindi} ke daam badh rahe hain! "
            f"{best['date']} ka wait karo — "
            f"₹{best['predicted_price']:.0f}/quintal mil sakta hai. "
            f"Abhi mat becho! 💰"
        )
    else:
        return (
            f"📊 {crop_hindi} ke daam stable hain. "
            f"{best['date']} ko ₹{best['predicted_price']:.0f}/quintal expected. "
            f"Aaj ya kal bech sakte ho. ✅"
        )


# ── ROUTES ───────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "app":     "KisanDB ML API",
        "version": "1.0",
        "status":  "running ✅",
        "routes": [
            "POST /predict",
            "GET  /crops",
            "GET  /prices/<crop>",
            "GET  /stats",
        ]
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict prices for next N days
    Body: { "crop": "Wheat", "days": 7 }
    """
    try:
        data = request.get_json()
        crop = data.get("crop", "Wheat")
        days = int(data.get("days", 7))

        model_data = load_model(crop)

        if not model_data:
            return jsonify({
                "error": f"No model found for {crop}. Run step2_train_model.py first."
            }), 404

        model       = model_data["model"]
        poly        = model_data["poly"]
        last_day    = model_data["last_day"]
        last_date  = model_data["last_date"]
        accuracy    = model_data["accuracy"]

        # Generate fresh predictions
        predictions = []
        for i in range(1, days + 1):
            day_df     = pd.DataFrame({"day_num": [last_day + i]})
            day_poly   = poly.transform(day_df)
            price      = model.predict(day_poly)[0]
            future_date = last_date + timedelta(days=i)

            predictions.append({
                "date":            future_date.strftime("%d %b %Y"),
                "date_short":      future_date.strftime("%d %b"),
                "day_name":        future_date.strftime("%A"),
                "predicted_price": round(float(price), 2),
            })

        best         = max(predictions, key=lambda x: x["predicted_price"])
        hindi_advice = generate_hindi_advice(crop, predictions, best)

        return jsonify({
            "crop":           crop,
            "predictions":    predictions,
            "bestSellDate": best["date_short"], # Match frontend interface
            "bestSellPrice": best["predicted_price"],
            "best_sell_day":  best["day_name"],
            "current_avg":    model_data["avg_price"],
            "confidence":     accuracy,
            "hindi_advice":   hindi_advice,
            "total_days_trained": model_data["total_days"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/crops", methods=["GET"])
def get_crops():
    """List all crops with available models"""
    try:
        model_files = glob.glob(os.path.join(MODELS_DIR, "*_model.pkl"))
        crops       = []

        for f in model_files:
            with open(f, "rb") as model_file:
                data = pickle.load(model_file)
                crops.append({
                    "crop":       data["crop"],
                    "accuracy":   data["accuracy"],
                    "avg_price":  data["avg_price"],
                    "total_days": data["total_days"],
                    "trained_at": data["trained_at"],
                })

        return jsonify({"crops": crops, "total": len(crops)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/prices/<crop>", methods=["GET"])
def get_prices(crop):
    """Get historical daily average prices for a crop"""
    try:
        pipeline = [
            {"$match": {"crop": crop}},
            {"$group": {
                "_id":       "$date",
                "avg_price": {"$avg": "$modalPrice"},
                "records":   {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
            {"$limit": 60}
        ]
        data = list(db.prices.aggregate(pipeline))

        result = [{
            "date":      str(d["_id"])[:10],
            "avg_price": round(d["avg_price"], 2),
            "records":   d["records"]
        } for d in data]

        return jsonify({
            "crop":   crop,
            "prices": result,
            "total":  len(result)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/stats", methods=["GET"])
def get_stats():
    """Overall database statistics"""
    try:
        total   = db.prices.count_documents({})
        crops   = db.prices.distinct("crop")
        states  = db.prices.distinct("state")
        markets = db.prices.distinct("mandi")

        return jsonify({
            "total_records": total,
            "crops":         crops,
            "total_states":  len(states),
            "total_markets": len(markets),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("  KisanDB ML API Server")
    print(f"  Running on http://localhost:{PORT}")
    print("=" * 50)
    app.run(debug=True, port=PORT)
