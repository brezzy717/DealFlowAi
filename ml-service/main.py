"""DealFlow AI — ML scoring service (Phase 4).

FastAPI microservice hosting the XGBoost/RandomForest/NN ensemble from the spec.
Until enough labeled outcomes exist, /score proxies the rules engine result and
records the ensemble's shadow prediction for comparison (see docs/ML-LIFECYCLE.md).

Run: uvicorn main:app --port 8000
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel

ENSEMBLE_WEIGHTS = {"xgboost": 0.42, "random_forest": 0.33, "neural_net": 0.25}

XGBOOST_CONFIG = {
    "objective": "reg:squarederror", "max_depth": 7, "learning_rate": 0.03,
    "n_estimators": 300, "subsample": 0.8, "colsample_bytree": 0.8,
    "reg_alpha": 0.1, "reg_lambda": 1.0, "min_child_weight": 3, "gamma": 0.1,
    "random_state": 42,
}
RANDOM_FOREST_CONFIG = {
    "n_estimators": 250, "max_depth": 12, "min_samples_split": 8,
    "min_samples_leaf": 4, "max_features": "sqrt", "oob_score": True,
    "random_state": 42, "n_jobs": -1,
}
NEURAL_NET_CONFIG = {
    "hidden_layer_sizes": (128, 64, 32), "activation": "relu", "solver": "adam",
    "alpha": 0.001, "learning_rate": "adaptive", "max_iter": 500,
    "early_stopping": True, "validation_fraction": 0.15, "random_state": 42,
}

MODELS: dict = {"xgboost": None, "random_forest": None, "neural_net": None, "scaler": None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load latest active models from storage (model_versions table → model_path).
    # On cold start with no trained models, service runs in shadow-off mode.
    yield


app = FastAPI(title="DealFlow ML Service", lifespan=lifespan)


class ScoreRequest(BaseModel):
    business_id: str
    feature_vector: dict[str, float]  # v3 feature names → values (already extracted)
    rules_score: float                # DealScore v3 rules result, always computed upstream


class ScoreResponse(BaseModel):
    business_id: str
    primary_score: float
    primary_engine: str
    shadow_ensemble_score: float | None
    model_predictions: dict[str, float] | None
    scored_at: str


def ensemble_predict(vec: np.ndarray) -> tuple[float, dict[str, float]] | None:
    if not all(MODELS[k] is not None for k in ("xgboost", "random_forest", "neural_net")):
        return None
    preds = {
        "xgboost": float(MODELS["xgboost"].predict(vec.reshape(1, -1))[0]),
        "random_forest": float(MODELS["random_forest"].predict(vec.reshape(1, -1))[0]),
        "neural_net": float(MODELS["neural_net"].predict(MODELS["scaler"].transform(vec.reshape(1, -1)))[0]),
    }
    score = sum(preds[k] * w for k, w in ENSEMBLE_WEIGHTS.items())
    return float(np.clip(score, 0, 100)), preds


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest) -> ScoreResponse:
    vec = np.array(list(req.feature_vector.values()), dtype=float)
    shadow = ensemble_predict(vec)
    return ScoreResponse(
        business_id=req.business_id,
        # Rules engine stays primary until the ensemble wins the 90-day precision bake-off
        primary_score=req.rules_score,
        primary_engine="rules_v3",
        shadow_ensemble_score=shadow[0] if shadow else None,
        model_predictions=shadow[1] if shadow else None,
        scored_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/train")
def train() -> dict:
    """Retraining entrypoint (called by Inngest weekly/monthly).

    1. Pull ml_training_data (proxy labels first, feedback labels as they accrue)
    2. Fit XGBoost/RF/NN with the configs above, time-based train/validation split
    3. Evaluate precision@platinum vs. the rules engine on held-out outcomes
    4. Write model_versions row + serialized artifacts; activate only on improvement
    """
    return {"status": "not_enough_labels", "detail": "Wire Supabase connection + label queries to enable."}


@app.get("/health")
def health() -> dict:
    return {"ok": True, "models_loaded": {k: v is not None for k, v in MODELS.items() if k != "scaler"}}
