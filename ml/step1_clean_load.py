# ============================================
# KisanDB - Step 1: Clean & Load Data
# Run: python clean_load.py
# ============================================

import pandas as pd
import pymongo
import glob
import os
from datetime import datetime

# ── CONFIG ────────────────────────────────────
# Using the real URI from .env.local
MONGODB_URI = "mongodb+srv://nileshsahoo837_db_user:Nilesh123@cluster0.ahvm5f5.mongodb.net/kisandb?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME     = "kisandb"
COLLECTION  = "prices"
DATA_FOLDER = "./data"          # Put all your CSVs here
# ──────────────────────────────────────────────

def clean_price(value):
    """Remove commas and convert to float"""
    try:
        return float(str(value).replace(",", "").strip())
    except:
        return None

def load_csv(filepath, db):
    """Clean one CSV file and load into MongoDB"""
    print(f"\n📂 Loading: {os.path.basename(filepath)}")

    try:
        # Read CSV (skip title row)
        df = pd.read_csv(filepath, skiprows=1)

        # Clean price columns
        for col in ["Min Price", "Max Price", "Modal Price"]:
            if col in df.columns:
                df[col] = df[col].apply(clean_price)

        # Drop rows where price is missing
        if "Modal Price" in df.columns:
            df = df.dropna(subset=["Modal Price"])

        # Clean date
        if "Price Date" in df.columns:
            df["Price Date"] = pd.to_datetime(
                df["Price Date"], format="%d-%m-%Y"
            )

        # Rename columns to match schema
        rename_map = {
            "Commodity":    "crop",
            "State":        "state",
            "District":     "district",
            "Market":       "mandi",
            "Variety":      "variety",
            "Grade":        "grade",
            "Min Price":    "minPrice",
            "Max Price":    "maxPrice",
            "Modal Price":  "modalPrice",
            "Price Date":   "date",
            "Price Unit":   "unit",
        }
        
        # Filter rename map to only columns that exist
        actual_rename = {k: v for k, v in rename_map.items() if k in df.columns}
        df = df.rename(columns=actual_rename)

        # Drop unused column
        df = df.drop(columns=["Commodity Group"], errors="ignore")

        # Convert to list of dicts
        records = df.to_dict("records")

        # Upsert into MongoDB (avoid duplicates)
        inserted = 0
        updated  = 0
        for record in records:
            result = db[COLLECTION].update_one(
                {
                    "crop":  record.get("crop"),
                    "mandi": record.get("mandi"),
                    "date":  record.get("date"),
                    "grade": record.get("grade"),
                },
                {"$set": record},
                upsert=True,
            )
            if result.upserted_id:
                inserted += 1
            else:
                updated += 1

        print(f"  ✅ Inserted: {inserted} | Updated: {updated}")
        if not df.empty:
            print(f"  📅 Date: {df['date'].iloc[0].strftime('%d %b %Y')}")
            print(f"  🏪 Markets: {df['mandi'].nunique()}")
            print(f"  💰 Avg Price: ₹{df['modalPrice'].mean():.0f}/quintal")
        return len(records)
    except Exception as e:
        print(f"  ❌ Error loading {filepath}: {str(e)}")
        return 0


def main():
    print("=" * 50)
    print("  KisanDB — Data Loader")
    print("=" * 50)

    # Use absolute paths relative to the script location
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_folder = os.path.join(base_dir, "data")
    
    # Connect to MongoDB
    client = pymongo.MongoClient(MONGODB_URI)
    db     = client[DB_NAME]

    # Create index for fast queries
    db[COLLECTION].create_index([("crop", 1), ("date", 1)])
    db[COLLECTION].create_index([("crop", 1), ("mandi", 1)])

    # Find all CSV files
    csv_files = glob.glob(os.path.join(data_folder, "*.csv"))

    if not csv_files:
        print(f"\n⚠️  No CSV files found in {data_folder}/")
        print("    Put your Agmarknet CSV files there and re-run.")
        return

    total = 0
    for filepath in sorted(csv_files):
        total += load_csv(filepath, db)

    print("\n" + "=" * 50)
    print(f"✅ DONE! Total records loaded: {total}")
    print(f"📊 MongoDB collection: {DB_NAME}.{COLLECTION}")

    # Summary
    count  = db[COLLECTION].count_documents({})
    crops  = db[COLLECTION].distinct("crop")
    states = db[COLLECTION].distinct("state")
    print(f"📦 Total in DB: {count} records")
    print(f"🌾 Crops: {crops}")
    print(f"🗺️  States: {len(states)} states")
    print("=" * 50)


if __name__ == "__main__":
    main()
