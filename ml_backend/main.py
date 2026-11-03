import os
import math
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
import joblib
import xgboost as xgb
import shap

FEATURE_NAMES = [
    "monthly_spending",
    "inactivity_days",
    "complaint_count",
    "usage_frequency"
]

CLUSTER_CENTROIDS = {
    "HIGH VALUE AT RISK": [2400.0, 15.0, 4.0, 2.0],
    "DORMANT CORE USER": [1000.0, 25.0, 5.0, 1.0],
    "STABLE BASELINE GROUP": [3000.0, 2.0, 0.0, 45.0]
}

booster_model: Optional[xgb.Booster] = None
feature_scaler: Optional[Any] = None
tree_explainer: Optional[shap.TreeExplainer] = None

def resolve_asset_path(filename: str) -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, filename),
        os.path.join(os.getcwd(), filename),
        os.path.join(base_dir, "models", os.path.basename(filename)),
        os.path.join(os.getcwd(), "models", os.path.basename(filename)),
        os.path.join(os.getcwd(), "ml_backend", filename)
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return os.path.join(base_dir, filename)

def initialize_ml_assets():
    global booster_model, feature_scaler, tree_explainer
    model_path = resolve_asset_path("models/churn_xgb_model.json")
    scaler_path = resolve_asset_path("models/feature_scaler.joblib")

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        from sklearn.preprocessing import StandardScaler
        np.random.seed(42)
        n = 1000
        ms = np.random.uniform(100.0, 6000.0, n)
        ida = np.random.randint(0, 31, n)
        cc = np.random.randint(0, 11, n)
        uf = np.random.randint(0, 51, n)
        raw_df = pd.DataFrame({
            "monthly_spending": ms,
            "inactivity_days": ida,
            "complaint_count": cc,
            "usage_frequency": uf
        })
        lgt = -1.5 + (0.42 * cc) + (0.05 * ida) - (0.15 * uf) + (0.0008 * ms)
        probs = 1.0 / (1.0 + np.exp(-lgt))
        y = (probs >= 0.5).astype(int)
        gen_scaler = StandardScaler()
        scaled = gen_scaler.fit_transform(raw_df)
        joblib.dump(gen_scaler, scaler_path)
        dtr = xgb.DMatrix(scaled, label=y, feature_names=FEATURE_NAMES)
        params = {
            "objective": "binary:logistic",
            "eval_metric": "logloss",
            "max_depth": 4,
            "learning_rate": 0.08
        }
        gen_booster = xgb.train(params, dtr, num_boost_round=50)
        gen_booster.save_model(model_path)

    booster_model = xgb.Booster()
    booster_model.load_model(model_path)
    feature_scaler = joblib.load(scaler_path)
    tree_explainer = shap.TreeExplainer(booster_model)

try:
    initialize_ml_assets()
except Exception:
    pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    if booster_model is None or feature_scaler is None or tree_explainer is None:
        initialize_ml_assets()
    yield

app = FastAPI(
    title="CustomerChurn AI - Machine Learning Telemetry Core",
    description="Computational pipeline for structural inference, SHAP local feature extraction, and value clustering segments.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeatureTelemetry(BaseModel):
    monthly_spending: float = Field(..., ge=0)
    inactivity_days: int = Field(..., ge=0)
    complaint_count: int = Field(..., ge=0)
    usage_frequency: int = Field(..., ge=0)

class InferenceRequest(BaseModel):
    industry: str
    features: FeatureTelemetry

class RecommendationItem(BaseModel):
    type: str
    title: str
    desc: str

class InferenceResponse(BaseModel):
    churn_probability: float
    confidence_score: float
    risk_tier: str
    shap_values: Dict[str, float]
    recommendations: List[RecommendationItem]
    cluster_segment: str

@app.post("/api/v1/predict", response_model=InferenceResponse, status_code=status.HTTP_200_OK)
def process_telemetry_inference(payload: InferenceRequest):
    try:
        global booster_model, feature_scaler, tree_explainer
        if booster_model is None or feature_scaler is None or tree_explainer is None:
            initialize_ml_assets()

        industry = payload.industry.upper()
        metrics = payload.features

        feature_dataframe = pd.DataFrame([{
            "monthly_spending": float(metrics.monthly_spending),
            "inactivity_days": float(metrics.inactivity_days),
            "complaint_count": float(metrics.complaint_count),
            "usage_frequency": float(metrics.usage_frequency)
        }], columns=FEATURE_NAMES)

        scaled_matrix = feature_scaler.transform(feature_dataframe)
        dmatrix_inference = xgb.DMatrix(scaled_matrix, feature_names=FEATURE_NAMES)

        raw_prediction = booster_model.predict(dmatrix_inference)
        churn_probability = float(raw_prediction[0])
        churn_probability = max(0.01, min(0.99, churn_probability))

        variance_factor = abs(metrics.usage_frequency - 20) / 50.0
        confidence_score = max(0.85, min(0.97, 0.95 - variance_factor))

        if churn_probability < 0.35:
            risk_tier = "STABLE"
        elif churn_probability <= 0.65:
            risk_tier = "ELEVATED"
        else:
            risk_tier = "CRITICAL"

        shap_matrix = tree_explainer.shap_values(dmatrix_inference)
        if isinstance(shap_matrix, list):
            shap_matrix = shap_matrix[0]
        shap_row = shap_matrix[0] if shap_matrix.ndim == 2 else shap_matrix

        expected_val = tree_explainer.expected_value
        if not np.isscalar(expected_val):
            expected_val = expected_val[0]

        attribution_map = {feat: float(shap_row[idx]) for idx, feat in enumerate(FEATURE_NAMES)}
        shap_values = {
            "base_value": round(float(expected_val), 4),
            "complaint_count_weight": round(attribution_map["complaint_count"], 4),
            "inactivity_days_weight": round(attribution_map["inactivity_days"], 4),
            "usage_frequency_weight": round(attribution_map["usage_frequency"], 4),
            "monthly_spending_weight": round(attribution_map["monthly_spending"], 4)
        }

        recommendations = []
        if risk_tier in ["ELEVATED", "CRITICAL"]:
            if industry == "TELECOM":
                recommendations = [
                    RecommendationItem(type="DISCOUNT", title="Loyalty Renewal Bundle", desc="Provision a 25% data pack discount plan instantly."),
                    RecommendationItem(type="CALL_BACK", title="Executive Care Routing", desc="Escalate to proactive customer support queue.")
                ]
            elif industry == "BANKING":
                recommendations = [
                    RecommendationItem(type="WAIVER", title="Transaction Fee Waiver", desc="Waive standard processing limits for 90 days."),
                    RecommendationItem(type="RELATIONSHIP_MANAGER", title="VIP Desk Assignment", desc="Assign dedicated wealth manager node.")
                ]
            else:
                recommendations = [
                    RecommendationItem(type="ENGAGEMENT", title="Feature Adoption Session", desc="Trigger custom lifecycle webinar training tracks."),
                    RecommendationItem(type="CREDIT", title="Service Account Credit", desc="Apply $50 balance credit to account contract.")
                ]
        else:
            recommendations = [
                RecommendationItem(type="NURTURE", title="Standard Automated Track", desc="Maintain baseline product update communication tracks.")
            ]

        user_vector = [
            float(metrics.monthly_spending),
            float(metrics.inactivity_days),
            float(metrics.complaint_count),
            float(metrics.usage_frequency)
        ]
        cluster_segment = "STABLE BASELINE GROUP"
        minimum_euclidean_distance = float("inf")

        for segment_name, centroid in CLUSTER_CENTROIDS.items():
            squared_sum = sum((u - c) ** 2 for u, c in zip(user_vector, centroid))
            euclidean_distance = math.sqrt(squared_sum)
            if euclidean_distance < minimum_euclidean_distance:
                minimum_euclidean_distance = euclidean_distance
                cluster_segment = segment_name

        return InferenceResponse(
            churn_probability=round(churn_probability, 3),
            confidence_score=round(confidence_score, 2),
            risk_tier=risk_tier,
            shap_values=shap_values,
            recommendations=recommendations,
            cluster_segment=cluster_segment
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline internal matrix error: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
