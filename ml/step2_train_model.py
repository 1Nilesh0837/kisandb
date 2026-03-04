# ============================================
# KisanDB - Step 2: Train ML Model
# Run: python step2_train_model.py
# ============================================

import pandas as pd
import numpy as np
import pymongo
import pickle
import os
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import r2_score, mean_absolute_error

# ── CONFIG ────────────────────────────────────
MONGODB_URI = "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority"
DB_NAME      = "kisandb"
MODELS_FOLDER = "./models"
# ──────────────────────────────────────────────

os.makedirs(MODELS_FOLDER, exist_ok=True)


def get_daily_avg(db, crop):
    """Fetch daily average price for a crop from MongoDB"""
    pipeline = [
        {"$match": {"crop": crop}},
        {"$group": {
            "_id": "$date",
            "avg_price": {"$avg": "$modalPrice"},
            "min_price": {"$min": "$minPrice"},
            "max_price": {"$max": "$maxPrice"},
            "records":   {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    data = list(db.prices.aggregate(pipeline))

    if not data:
        return pd.DataFrame()

    df = pd.DataFrame(data)
    df["date"]      = pd.to_datetime(df["_id"])
    df["avg_price"] = df["avg_price"].round(2)
    df             = df.sort_values("date").reset_index(drop=True)
    df["day_num"]  = range(len(df))
    return df


def train_model(crop, df):
    """Train Polynomial Regression model"""
    X = df[["day_num"]]
    y = df["avg_price"]

    # Try degree 2 and 3, pick better one
    best_model = None
    best_score = -np.inf
    best_poly  = None
    best_degree = 2

    for degree in [2, 3]:
        poly   = PolynomialFeatures(degree=degree)
        X_poly = poly.fit_transform(X)

        model = LinearRegression()
        model.fit(X_poly, y)

        score = r2_score(y, model.predict(X_poly))
        if score > best_score:
            best_score  = score
            best_model  = model
            best_poly   = poly
            best_degree = degree

    # Final metrics
    y_pred = best_model.predict(best_poly.transform(X))
    mae    = mean_absolute_error(y, y_pred)
    r2     = r2_score(y, y_pred) * 100

    print(f"\n  📈 Best Polynomial Degree: {best_degree}")
    print(f"  🎯 Accuracy (R²):   {r2:.2f}%")
    print(f"  📏 Error Margin:    ₹{mae:.2f}/quintal")

    return best_model, best_poly, r2, mae


def predict_next_days(model, poly, df, days=7):
    """Predict prices for next N days"""
    from datetime import timedelta

    last_day  = df["day_num"].max()
    last_date = df["date"].max()

    predictions = []
    for i in range(1, days + 1):
        day_num    = pd.DataFrame({"day_num": [last_day + i]})
        day_poly   = poly.transform(day_num)
        price      = model.predict(day_poly)[0]
        future_date = last_date + timedelta(days=i)

        predictions.append({
            "date":            future_date.strftime("%d %b %Y"),
            "day_name":        future_date.strftime("%A"),
            "predicted_price": round(float(price), 2),
        })

    return predictions


def save_model(crop, model, poly, df, accuracy, mae, predictions, filename):
    """Save trained model + metadata to pickle file"""

    payload = {
        "crop":         crop,
        "model":        model,
        "poly":         poly,
        "last_day":     int(df["day_num"].max()),
        "last_date":    df["date"].max(),
        "accuracy":     round(accuracy, 2),
        "mae":          round(mae, 2),
        "avg_price":    round(df["avg_price"].mean(), 2),
        "min_price":    round(df["avg_price"].min(), 2),
        "max_price":    round(df["avg_price"].max(), 2),
        "total_days":   len(df),
        "predictions":  predictions,
        "trained_at":   pd.Timestamp.now().isoformat(),
    }

    with open(filename, "wb") as f:
        pickle.dump(payload, f)

    print(f"  💾 Model saved: {filename}")
    return filename


def main():
    print("=" * 50)
    print("  KisanDB — ML Model Trainer")
    print("=" * 50)

    # Use absolute paths relative to the script location
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    client = pymongo.MongoClient(MONGODB_URI)
    db     = client[DB_NAME]

    # Get all unique crops
    crops = db.prices.distinct("crop")
    print(f"\n🌾 Found crops: {crops}")

    if not crops:
        print("⚠️ No crops found in 'prices' collection. Run step1_clean_load.py first.")
        return

    for crop in crops:
        print(f"\n{'─' * 40}")
        print(f"Training model for: {crop}")
        print(f"{'─' * 40}")

        # Get data
        df = get_daily_avg(db, crop)
        
        if df.empty:
            print(f"  ⚠️ No data found for {crop}. Skipping.")
            continue
            
        print(f"  📅 Days of data: {len(df)}")
        print(f"  📅 Range: {df['date'].min().strftime('%d %b')} → {df['date'].max().strftime('%d %b %Y')}")
        print(f"  💰 Avg Price: ₹{df['avg_price'].mean():.0f}/quintal")

        if len(df) < 5: # Reduced from 10 to 5 for initial testing
            print(f"  ⚠️ Not enough data (need 5+ days). Skipping.")
            continue

        # Train
        model, poly, accuracy, mae = train_model(crop, df)

        # Predict next 7 days
        predictions = predict_next_days(model, poly, df, days=7)
        best = max(predictions, key=lambda x: x["predicted_price"])

        print(f"\n  🔮 7-Day Predictions:")
        for p in predictions:
            marker = "⭐" if p["date"] == best["date"] else "  "
            print(f"  {marker} {p['date']} ({p['day_name'][:3]}): ₹{p['predicted_price']:.0f}/qtl")

        print(f"\n  🏆 Best sell day: {best['date']} @ ₹{best['predicted_price']:.0f}/qtl")

        # Save model using absolute path
        filename = os.path.join(models_dir, f"{crop.replace(' ', '_')}_model.pkl")
        save_model(crop, model, poly, df, accuracy, mae, predictions, filename)

    print("\n" + "=" * 50)
    print("✅ ALL MODELS TRAINED SUCCESSFULLY!")
    print(f"📁 Models saved in: {models_dir}/")
    print("▶️  Next: Run step3_api_server.py")
    print("=" * 50)


if __name__ == "__main__":
    main()
