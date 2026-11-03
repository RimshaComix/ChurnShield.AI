import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

def train_and_initialize():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(script_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, "churn_xgb_model.json")
    scaler_path = os.path.join(models_dir, "feature_scaler.joblib")

    np.random.seed(42)
    n_samples = 500

    monthly_spending = np.random.uniform(50.0, 5000.0, n_samples)
    inactivity_days = np.random.randint(0, 91, n_samples)
    complaint_count = np.random.randint(0, 16, n_samples)
    usage_frequency = np.random.randint(0, 51, n_samples)

    feature_names = [
        "monthly_spending",
        "inactivity_days",
        "complaint_count",
        "usage_frequency"
    ]

    features_df = pd.DataFrame({
        "monthly_spending": monthly_spending,
        "inactivity_days": inactivity_days,
        "complaint_count": complaint_count,
        "usage_frequency": usage_frequency
    }, columns=feature_names)

    logit_scores = (
        -1.2
        + (0.35 * complaint_count)
        + (0.04 * inactivity_days)
        - (0.12 * usage_frequency)
        + (0.0005 * monthly_spending)
    )
    probabilities = 1.0 / (1.0 + np.exp(-logit_scores))
    y = (probabilities >= 0.5).astype(int)

    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features_df)
    joblib.dump(scaler, scaler_path)

    dtrain = xgb.DMatrix(scaled_features, label=y, feature_names=feature_names)
    params = {
        "objective": "binary:logistic",
        "max_depth": 4,
        "eval_metric": "logloss",
        "learning_rate": 0.1,
        "seed": 42
    }
    booster = xgb.train(params, dtrain, num_boost_round=15)
    booster.save_model(model_path)

    verified_scaler = joblib.load(scaler_path)
    verified_booster = xgb.Booster()
    verified_booster.load_model(model_path)

    mock_record = pd.DataFrame([{
        "monthly_spending": 2400.0,
        "inactivity_days": 14,
        "complaint_count": 4,
        "usage_frequency": 2
    }], columns=feature_names)

    mock_scaled = verified_scaler.transform(mock_record)
    mock_dmatrix = xgb.DMatrix(mock_scaled, feature_names=feature_names)
    mock_prediction = float(verified_booster.predict(mock_dmatrix)[0])

    print(f"Pipeline verification successful. Mock churn probability: {mock_prediction:.4f}")

if __name__ == "__main__":
    train_and_initialize()

