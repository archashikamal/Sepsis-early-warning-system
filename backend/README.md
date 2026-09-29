# ⚡ Sepsis Early-Warning Backend API

High-performance inference API built with **FastAPI** and **PyTorch**, serving sepsis risk scores and attention explainability weights over 8-hour rolling vitals sequences.

---

## 🛠 Features

- **FastAPI Framework:** Asynchronous, low-latency REST endpoints with automatic OpenAPI/Swagger documentation.
- **PyTorch Model Inference:** Loads pre-trained `AttnLSTM` in evaluation mode with CPU-optimized tensor computations.
- **Exact Clinical Normalization:** Applies per-patient baseline normalization identical to model training.
- **Strict Pydantic Validation:** Validates exact 8-hour windows and physiological bounds (e.g. positive heart rates, valid SpO2 percentages).
- **CORS Enabled:** Seamless connection with the React frontend dev and production servers.

---

## 📁 Directory Layout

```
backend/
├── main.py              # FastAPI app, endpoint routes, and validation schemas
├── models.py            # Neural network architectures (AttnLSTM, TCNClassifier)
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
└── README.md            # Backend documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+ (tested on Python 3.11)

### 2. Setup Virtual Environment

On **Windows (PowerShell)**:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

On **macOS / Linux**:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Server
```bash
uvicorn main:app --reload --port 8000
```

The server will start at:
- **API URL:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

---

## 📡 API Reference

### 1. Health Check
`GET /health`

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

---

### 2. Model Information
`GET /model-info`

Returns model hyperparameters, architecture type, validation benchmarks (AUROC, AUPRC, lead time), and feature column mappings.

---

### 3. Predict Sepsis Risk
`POST /predict`

Scores an 8-hour patient vitals sequence and returns the sepsis probability, alert trigger status, and temporal attention weights.

#### Request Body Schema
The request must contain an array of **exactly 8 readings** ordered from oldest ($t = 1$) to newest ($t = 8$):

```json
{
  "readings": [
    {
      "heartrate": 88.0,
      "respiration": 18.0,
      "temperature": 37.2,
      "sao2": 96.0,
      "systemicsystolic": 118.0,
      "systemicdiastolic": 74.0,
      "systemicmean": 89.0,
      "lactate": 1.4
    }
    // ... 8 readings in total
  ],
  "custom_threshold": 0.5
}
```

#### Example cURL
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{"readings": [ ... 8 readings ... ], "custom_threshold": 0.5}'
```

#### Response (200 OK)
```json
{
  "risk_score": 0.847,
  "alert": true,
  "threshold_used": 0.5,
  "attention_weights": [0.08, 0.09, 0.10, 0.11, 0.15, 0.17, 0.14, 0.16]
}
```

---

## ⚙️ Configuration

Environment variables can be set in a `.env` file or exported in your shell:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for Uvicorn server |
| `MODEL_METADATA_PATH` | `../models/model_metadata.json` | Path to metadata configuration file |
| `MODEL_WEIGHTS_PATH` | `../models/best_model_weights.pt` | Path to PyTorch model weights checkpoint |
