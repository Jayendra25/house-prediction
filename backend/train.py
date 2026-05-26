"""
train.py - House Price Prediction Model Training Script

This script handles:
1. Downloading the dataset from Kaggle (if not already present)
2. Preprocessing the data
3. Training a Random Forest Regressor
4. Evaluating the model using R2 score
5. Saving the trained model as model.pkl
"""

import os
import zipfile
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
import joblib


# ──────────────────────────────────────────────
# PATHS
# ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
ZIP_FILENAME = "house-prices-india.zip"
ZIP_PATH = os.path.join(BASE_DIR, ZIP_FILENAME)


# ──────────────────────────────────────────────
# FEATURES USED FOR TRAINING
# These must match exactly with what main.py sends
# ──────────────────────────────────────────────
FEATURE_NAMES = [
    "living_area",
    "bedrooms",
    "bathrooms",
    "house_age",
    "postal_code",
    "grade",
    "condition",
    "distance_from_airport",
    "schools_nearby",
]


# ──────────────────────────────────────────────
# STEP 1: Download & Extract Dataset
# ──────────────────────────────────────────────
def download_dataset():
    """Download dataset from Kaggle if not already present."""

    # Create data directory if it doesn't exist
    os.makedirs(DATA_DIR, exist_ok=True)

    # Check if CSV files already exist in data folder
    csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    if csv_files:
        print(f"✅ Dataset already exists: {csv_files}")
        return

    print("📥 Downloading dataset from Kaggle...")
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi

        api = KaggleApi()
        api.authenticate()
        api.dataset_download_files(
            "sukhmandeepsinghbrar/house-prices-india",
            path=BASE_DIR,
            unzip=False,
        )
        print("✅ Download complete!")
    except OSError as e:
        if "kaggle.json" in str(e):
            print("❌ Kaggle API key not found!")
            print("   1. Go to https://www.kaggle.com/settings → Create New Token")
            print("   2. Save kaggle.json to ~/.kaggle/kaggle.json")
            print("   3. Run: chmod 600 ~/.kaggle/kaggle.json")
            print("   4. Re-run this script")
        raise
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        raise

    # Extract ZIP file
    if os.path.exists(ZIP_PATH):
        print("📦 Extracting ZIP file...")
        with zipfile.ZipFile(ZIP_PATH, "r") as zip_ref:
            zip_ref.extractall(DATA_DIR)
        os.remove(ZIP_PATH)  # Clean up ZIP file
        print("✅ Extraction complete!")
    else:
        print(f"❌ ZIP file not found at {ZIP_PATH}")
        raise FileNotFoundError(f"ZIP file not found at {ZIP_PATH}")


# ──────────────────────────────────────────────
# STEP 2: Load Dataset
# ──────────────────────────────────────────────
def load_dataset():
    """Find and load the CSV file from the data directory."""

    csv_files = []
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            if file.endswith(".csv"):
                csv_files.append(os.path.join(root, file))

    if not csv_files:
        print("❌ No CSV files found in data directory!")
        raise FileNotFoundError("No CSV file found in data/")

    # Use the first CSV found
    csv_path = csv_files[0]
    print(f"📂 Loading dataset: {csv_path}")

    df = pd.read_csv(csv_path)
    print(f"📊 Dataset shape: {df.shape}")
    print(f"📋 Columns: {list(df.columns)}")

    return df


# ──────────────────────────────────────────────
# STEP 3: Preprocess Data
# ──────────────────────────────────────────────
def preprocess_data(df):
    """Clean and prepare data for training."""

    print("\n🔧 Preprocessing data...")

    # ── Standardize column names (lowercase, strip spaces, underscores) ──
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    print(f"   Cleaned columns: {list(df.columns)}")

    # ── Handle missing values (fill numeric with median) ──
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().sum() > 0:
            df[col] = df[col].fillna(df[col].median())
            print(f"   Filled missing values in '{col}' with median")

    # ── Compute house_age from built_year ──
    current_year = pd.Timestamp.now().year
    df["house_age"] = current_year - df["built_year"]
    print(f"   Computed house_age = {current_year} - built_year")

    # ── Select features and rename to simple names ──
    # Map dataset column names → simple feature names
    rename_map = {
        "living_area": "living_area",
        "number_of_bedrooms": "bedrooms",
        "number_of_bathrooms": "bathrooms",
        "house_age": "house_age",
        "postal_code": "postal_code",
        "grade_of_the_house": "grade",
        "condition_of_the_house": "condition",
        "distance_from_the_airport": "distance_from_airport",
        "number_of_schools_nearby": "schools_nearby",
    }

    X = df[list(rename_map.keys())].rename(columns=rename_map)
    y = df["price"]

    print(f"\n   ✅ Features ({len(FEATURE_NAMES)}): {list(X.columns)}")
    print(f"   ✅ Target: price")
    print(f"   ✅ Samples: {len(X)}")

    return X, y


# ──────────────────────────────────────────────
# STEP 4: Train Model
# ──────────────────────────────────────────────
def train_model(X, y):
    """Train a Random Forest Regressor and evaluate it."""

    print("\n🤖 Training Random Forest Regressor...")

    # Split into train and test sets (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"   Train samples: {len(X_train)}")
    print(f"   Test samples:  {len(X_test)}")

    # Train the model
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1,  # Use all CPU cores
    )
    model.fit(X_train, y_train)

    # Evaluate using R2 score
    train_score = r2_score(y_train, model.predict(X_train))
    test_score = r2_score(y_test, model.predict(X_test))

    print(f"\n📈 Model Performance:")
    print(f"   R² Score (Train): {train_score:.4f}")
    print(f"   R² Score (Test):  {test_score:.4f}")

    return model


# ──────────────────────────────────────────────
# STEP 5: Save Model
# ──────────────────────────────────────────────
def save_model(model):
    """Save the trained model to a .pkl file."""

    joblib.dump(model, MODEL_PATH)
    print(f"\n💾 Model saved to: {MODEL_PATH}")


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("🏠 House Price Prediction - Model Training")
    print("=" * 50)

    # Step 1: Download dataset
    download_dataset()

    # Step 2: Load dataset
    df = load_dataset()

    # Step 3: Preprocess data
    X, y = preprocess_data(df)

    # Step 4: Train model
    model = train_model(X, y)

    # Step 5: Save model
    save_model(model)

    print("\n" + "=" * 50)
    print("✅ Training complete! You can now run the API:")
    print("   uvicorn main:app --reload")
    print("=" * 50)
