"""
Sepsis Early-Warning System — FastAPI Backend
=============================================

Startup:
  1. Load model_metadata.json from the same directory as this file.
  2. Reconstruct the correct model class (AttnLSTM / TCNClassifier).
  3. Load best_model_weights.pt state_dict.
  4. Set model to eval mode and keep on CPU (GPU optional).

Endpoints:
  POST /predict    — score an 8-hour vital-sign window
  GET  /model-info — return the raw metadata JSON
  GET  /health     — liveness check
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import List, Optional

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, model_validator

from models import build_model

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# File paths (resolved dynamically from models/, root, or environment)
# ---------------------------------------------------------------------------
import os

BASE_DIR = Path(__file__).parent.parent          # project root

def _resolve_model_path(filename: str, env_var: str) -> Path:
    if os.environ.get(env_var):
        return Path(os.environ[env_var])
    for candidate in [
        BASE_DIR / "models" / filename,
        BASE_DIR / filename,
        Path(__file__).parent / filename,
    ]:
        if candidate.exists():
            return candidate
    return BASE_DIR / "models" / filename

METADATA_PATH = _resolve_model_path("model_metadata.json", "MODEL_METADATA_PATH")
WEIGHTS_PATH  = _resolve_model_path("best_model_weights.pt", "MODEL_WEIGHTS_PATH")

# ---------------------------------------------------------------------------
# Global state loaded at startup
# ---------------------------------------------------------------------------
_model: torch.nn.Module | None = None
_metadata: dict = {}
_feature_cols: list[str] = []
_baseline_hours: int = 4
_lookback_hours: int = 8

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Sepsis Early-Warning API",
    description=(
        "Research prototype — validated on synthetic + eICU-CRD demo data. "
        "NOT a certified clinical device."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup / Shutdown
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def load_model() -> None:
    global _model, _metadata, _feature_cols, _baseline_hours, _lookback_hours

    # --- Load metadata ---
    if not METADATA_PATH.exists():
        raise RuntimeError(
            f"model_metadata.json not found at {METADATA_PATH}.\n"
            "Place the file in the project root directory."
        )
    with METADATA_PATH.open() as f:
        _metadata = json.load(f)

    prep = _metadata["preprocessing"]
    _feature_cols   = prep["feature_cols"]
    _baseline_hours = prep["baseline_hours"]
    _lookback_hours = prep["lookback_hours"]

    logger.info("Metadata loaded — model_type=%s, features=%s",
                _metadata["model_config"]["model_type"], _feature_cols)

    # --- Build model ---
    _model = build_model(_metadata["model_config"])

    # --- Load weights ---
    if not WEIGHTS_PATH.exists():
        raise RuntimeError(
            f"best_model_weights.pt not found at {WEIGHTS_PATH}.\n"
            "Place the file in the project root directory."
        )
    state_dict = torch.load(WEIGHTS_PATH, map_location="cpu", weights_only=True)
    _model.load_state_dict(state_dict)
    _model.eval()

    logger.info("Model loaded and set to eval mode successfully.")


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

REQUIRED_FEATURES = [
    "heartrate",
    "respiration",
    "temperature",
    "sao2",
    "systemicsystolic",
    "systemicdiastolic",
    "systemicmean",
    "lactate",
]


class HourlyReading(BaseModel):
    """One hourly row of vital signs."""

    heartrate:         float
    respiration:       float
    temperature:       float
    sao2:              float
    systemicsystolic:  float
    systemicdiastolic: float
    systemicmean:      float
    lactate:           float

    def to_array(self, feature_order: list[str]) -> list[float]:
        d = self.model_dump()
        return [d[f] for f in feature_order]


class PredictRequest(BaseModel):
    """Eight hourly readings forming one 8-hour window."""

    readings: List[HourlyReading]

    @field_validator("readings")
    @classmethod
    def must_have_exactly_8(cls, v: list) -> list:
        if len(v) != 8:
            raise ValueError(
                f"Expected exactly 8 hourly readings, got {len(v)}. "
                "Each reading represents one hour of the 8-hour window."
            )
        return v


class PredictResponse(BaseModel):
    risk_score:       float
    alert:            bool
    threshold_used:   float
    attention_weights: Optional[List[float]] = None


class ModelInfoResponse(BaseModel):
    metadata: dict


# ---------------------------------------------------------------------------
# Preprocessing — must match training exactly
# ---------------------------------------------------------------------------

def normalize_window(X: np.ndarray, baseline_hours: int) -> np.ndarray:
    """
    Per-patient z-score normalization against the first `baseline_hours` rows.

    Matches the training notebook logic:
        mu  = baseline.mean(axis=0)              # shape [n_features]
        std = baseline.std(axis=0, ddof=0) + 1e-8  # population std + epsilon
        X_norm = (X - mu) / std

    Args:
        X            : ndarray of shape [T, n_features]  (raw vitals)
        baseline_hours: int  (number of leading rows to use as reference)

    Returns:
        X_norm: ndarray of shape [T, n_features]  (z-scored)
    """
    baseline = X[:baseline_hours]                           # [baseline_hours, F]
    mu  = baseline.mean(axis=0)                             # [F]
    std = baseline.std(axis=0, ddof=0) + 1e-8              # [F]  population std
    return (X - mu) / std


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.get("/model-info", response_model=ModelInfoResponse)
async def model_info():
    if not _metadata:
        raise HTTPException(status_code=503, detail="Model metadata not loaded yet.")
    return {"metadata": _metadata}


@app.post("/predict", response_model=PredictResponse)
async def predict(body: PredictRequest):
    if _model is None:
        raise HTTPException(status_code=503, detail="Model is still loading. Try again shortly.")

    # --- Build raw matrix [8, 8] ---
    try:
        X_raw = np.array(
            [r.to_array(_feature_cols) for r in body.readings],
            dtype=np.float32,
        )   # shape [8, 8]
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse readings: {exc}")

    # --- Normalize ---
    X_norm = normalize_window(X_raw, _baseline_hours)      # [8, 8]

    # --- Tensor [1, 8, 8] (batch_size=1) ---
    tensor = torch.from_numpy(X_norm).unsqueeze(0)         # [1, T, F]

    # --- Forward pass (no grad) ---
    with torch.no_grad():
        risk_tensor, attn_tensor = _model(tensor)

    risk_score = float(risk_tensor.squeeze())

    # Attention weights (only AttnLSTM returns non-None)
    attention_weights: list[float] | None = None
    if attn_tensor is not None:
        attention_weights = attn_tensor.squeeze(0).tolist()  # [T]

    # Default threshold from metadata if present, else 0.5
    threshold = float(
        _metadata.get("threshold", 0.5)
    )

    return PredictResponse(
        risk_score=risk_score,
        alert=risk_score >= threshold,
        threshold_used=threshold,
        attention_weights=attention_weights,
    )
