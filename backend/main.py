"""
main.py - House Price Prediction API

FastAPI application with a /predict endpoint that uses
the trained Random Forest model to predict house prices.
"""

import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")


# ──────────────────────────────────────────────
# LOAD MODEL & COMPUTE SCALING
# ──────────────────────────────────────────────
def compute_scale_factor():
    """Compute a realistic scale factor based on dataset mean price."""
    realistic_mean = 8000000.0  # 80 lakhs
    try:
        data_dir = os.path.join(BASE_DIR, "data")
        if os.path.exists(data_dir):
            csv_files = [f for f in os.listdir(data_dir) if f.endswith(".csv")]
            if csv_files:
                df = pd.read_csv(os.path.join(data_dir, csv_files[0]))
                df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
                mean_price = df["price"].mean()
                return realistic_mean / mean_price
    except Exception as e:
        print(f"⚠️ Could not compute scale factor from dataset: {e}")
    
    return 1.0  # Fallback to no scaling if dataset missing

SCALE_FACTOR = compute_scale_factor()

def load_model():
    """Load the trained model from disk."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "model.pkl not found! Run 'python train.py' first to train the model."
        )
    return joblib.load(MODEL_PATH)


model = load_model()


# ──────────────────────────────────────────────
# FASTAPI APP
# ──────────────────────────────────────────────
app = FastAPI(
    title="🏠 House Price Prediction API",
    description="Predict house prices using a trained Random Forest model.",
    version="2.0.0",
)

# ── CORS Middleware ──
# Allows frontend apps from any origin to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ──────────────────────────────────────────────
class HouseInput(BaseModel):
    """Input schema for house price prediction."""

    living_area: float = Field(
        ..., gt=0, description="Living area of the house (in sq. ft.)", example=1500.0
    )
    bedrooms: int = Field(
        ..., ge=0, description="Number of bedrooms", example=3
    )
    bathrooms: float = Field(
        ..., ge=0, description="Number of bathrooms", example=2.5
    )
    built_year: int = Field(
        ..., gt=1800, description="Year the house was built", example=2010
    )
    postal_code: int = Field(
        ..., description="Postal code of the property", example=122004
    )
    grade: int = Field(
        ..., ge=1, le=13, description="Grade of the house (1-13)", example=8
    )
    condition: int = Field(
        ..., ge=1, le=5, description="Condition of the house (1-5)", example=3
    )
    distance_from_airport: float = Field(
        ..., ge=0, description="Distance from airport (in km)", example=50.0
    )
    schools_nearby: int = Field(
        ..., ge=0, description="Number of schools nearby", example=2
    )


class PredictionResponse(BaseModel):
    """Output schema for the prediction result."""

    predicted_price: float = Field(
        ..., description="Predicted house price"
    )
    currency: str = Field(
        default="INR", description="Currency unit"
    )
    input_data: dict = Field(
        ..., description="The input values used for prediction"
    )


# ──────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────
@app.get("/")
def root():
    """Health check / Welcome endpoint."""
    return {
        "message": "🏠 House Price Prediction API is running!",
        "docs": "/docs",
        "usage": "POST /predict with living_area, bedrooms, bathrooms, built_year, postal_code, grade, condition, distance_from_airport, schools_nearby",
    }


@app.post("/predict", response_model=PredictionResponse)
def predict_price(data: HouseInput):
    """
    Predict the price of a house based on its features.

    - **living_area**: Living area in square feet
    - **bedrooms**: Number of bedrooms
    - **bathrooms**: Number of bathrooms
    - **built_year**: Year the house was built (converted to house_age internally)
    - **postal_code**: Postal code of the property
    - **grade**: Grade of the house (1-13)
    - **condition**: Condition of the house (1-5)
    - **distance_from_airport**: Distance from airport in km
    - **schools_nearby**: Number of schools nearby
    """
    try:
        # Compute house_age from built_year (same as training)
        current_year = pd.Timestamp.now().year
        house_age = current_year - data.built_year

        # Prepare input as a DataFrame with the same feature names used in training
        input_df = pd.DataFrame([{
            "living_area": data.living_area,
            "bedrooms": data.bedrooms,
            "bathrooms": data.bathrooms,
            "house_age": house_age,
            "postal_code": data.postal_code,
            "grade": data.grade,
            "condition": data.condition,
            "distance_from_airport": data.distance_from_airport,
            "schools_nearby": data.schools_nearby,
        }])

        # Make prediction
        prediction = model.predict(input_df)
        
        # Apply scaling based on dataset mean
        final_price = float(prediction[0]) * SCALE_FACTOR
        predicted_price = round(final_price, 2)

        return PredictionResponse(
            predicted_price=predicted_price,
            currency="INR",
            input_data={
                "living_area": data.living_area,
                "bedrooms": data.bedrooms,
                "bathrooms": data.bathrooms,
                "built_year": data.built_year,
                "house_age": house_age,
                "postal_code": data.postal_code,
                "grade": data.grade,
                "condition": data.condition,
                "distance_from_airport": data.distance_from_airport,
                "schools_nearby": data.schools_nearby,
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}",
        )


@app.get("/health")
def health_check():
    """Check if the API and model are operational."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
    }
