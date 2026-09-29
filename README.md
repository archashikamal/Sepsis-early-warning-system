# 🏥 Sepsis Early-Warning System (SEWS)

An end-to-end clinical decision support platform for **early detection of sepsis** from multivariate vital signs streaming in Intensive Care Units (ICUs). Built with a temporal-attention deep learning model (**AttnLSTM**), a **FastAPI** inference backend, and a reactive **React + Recharts** clinical telemetry dashboard.

>  **Research Prototype Only.** Validated on synthetic + eICU-CRD demo data. Not a certified clinical device. Do not use to guide real-world patient care decisions.

---

##  Table of Contents

- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Clinical & ML Validation](#-clinical--ml-validation)
- [Repository Structure](#-repository-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [API Reference](#-api-reference)
- [Git & GitHub Publishing Guide](#-git--github-publishing-guide)
- [License & Disclaimer](#-license--disclaimer)

---

## 🏛 System Architecture

```
                                  CLINICAL DATA STREAM
                                (8-Hour Rolling Window)
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       Dynamic Baseline Normalization         │
                    │   Z-score against first 4 hours of window    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │             AttnLSTM Deep Model              │
                    │  • 1-Layer Recurrent LSTM (32 hidden units)  │
                    │  • Additive Temporal Attention over 8 hours  │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                            FastAPI REST Service (Port 8000)                      │
 │  • POST /predict     → Returns risk score [0, 1] + 8 temporal attention weights   │
 │  • GET  /model-info  → Exposes architecture specs & validation metrics           │
 │  • GET  /health      → Liveness and model readiness probe                        │
 └─────────────────────────────────────────┬────────────────────────────────────────┘
                                           │  JSON Stream
                                           ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                           React Clinical UI (Port 5173)                          │
 │  • Real-Time Risk Gauge with Dynamic Alert Banner                                │
 │  • Client-Side Adjustable Alert Threshold Slider                                 │
 │  • Multi-Signal Vitals Trend Chart (HR, Resp, Temp, SpO2, BP, Lactate)           │
 │  • Hourly Attention Weight Distribution Heatmap                                  │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **8-Hour Rolling Sequence Scoring:** Continuously evaluates multivariate physiological trends over an 8-hour window.
- **Attention Explainability:** Visualizes the specific hours that contributed most heavily to the risk score, providing clinicians with interpretable reasoning.
- **Dynamic Risk Threshold Slider:** Adjust alarm thresholds in real-time on the client side with instant visual alerts without re-querying the API.
- **Preloaded Patient Trajectories:** Test with pre-configured clinical phenotypes:
  - *Septic-Trending:* Deteriorating hemodynamic vitals and climbing lactate.
  - *Stable Patient:* Normal ICU vital signs profile.
  - *Early Recovery:* Normalizing vitals following successful therapeutic intervention.
- **Interactive Vitals Charting:** Multi-line telemetry curves with tooltips, legend toggling, and zoom courtesy of Recharts.

---

## 📊 Clinical & ML Validation

The model was evaluated against temporal baseline benchmarks on eICU-CRD cohorts for predicting sepsis onset within a **6-hour horizon**:

| Evaluation Metric | AttnLSTM (Selected) | TCN (Temporal ConvNet) |
| :--- | :---: | :---: |
| **AUROC** | **0.9813** | 0.9803 |
| **AUPRC** | **0.7873** | 0.7818 |
| **False Alarms per Patient-Day** | **0.469** | 0.740 |
| **Median Detection Lead Time** | **8.0 Hours** | 9.0 Hours |

### Monitored Physiological Variables:
1. `heartrate` (bpm)
2. `respiration` (breaths/min)
3. `temperature` (°C)
4. `sao2` (% O2 saturation)
5. `systemicsystolic` (mmHg)
6. `systemicdiastolic` (mmHg)
7. `systemicmean` (MAP, mmHg)
8. `lactate` (mmol/L)

---

## 📂 Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions lint & build checks
├── backend/
│   ├── main.py                  # FastAPI server & prediction routes
│   ├── models.py                # PyTorch AttnLSTM & TCN architectures
│   ├── requirements.txt         # Backend Python dependencies
│   ├── .env.example             # Backend environment template
│   └── README.md                # Backend service documentation
├── frontend/
│   ├── public/                  # Clinical favicons & assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── AttentionPanel.jsx      # Hourly attention weight bar chart
│   │   │   ├── ModelInfoPanel.jsx      # Metrics and clinical disclaimer
│   │   │   ├── RiskScoreDisplay.jsx    # Circular gauge & alert banner
│   │   │   ├── VitalsInputPanel.jsx    # Patient selector and editable table
│   │   │   └── VitalsTrendChart.jsx    # Multi-line vitals trend graph
│   │   ├── App.jsx              # Main React container
│   │   ├── constants.js         # Preset patient datasets & vital ranges
│   │   ├── index.css            # Clinical dark-mode design system
│   │   └── main.jsx             # React entry point
│   ├── package.json             # NPM dependencies & scripts
│   ├── vite.config.js           # Vite build configuration
│   ├── .env.example             # Frontend environment template
│   └── README.md                # Frontend documentation
├── models/
│   ├── best_model_weights.pt    # Pre-trained PyTorch model weights (~28 KB)
│   ├── model_metadata.json      # Model hyperparameters & benchmark metrics
│   └── README.md                # Model architecture & evaluation notes
├── .gitignore                   # Ignores virtualenvs, node_modules, cache & secrets
├── CONTRIBUTING.md              # Open source contribution guidelines
├── LICENSE                      # MIT License + Medical Research Disclaimer
└── README.md                    # Project overview & documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python:** $\ge$ 3.9 (tested on Python 3.11)
- **Node.js:** $\ge$ 18.0 & **npm:** $\ge$ 9.0

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux:
# python3 -m venv .venv
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

- API server will be available at: **http://localhost:8000**
- Interactive Swagger docs at: **http://localhost:8000/docs**

---

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```

- Open **http://localhost:5173** in your web browser.

---

## 🔌 API Reference

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

### Sepsis Risk Prediction
```http
POST /predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "readings": [
    {
      "heartrate": 92.0,
      "respiration": 22.0,
      "temperature": 38.3,
      "sao2": 94.0,
      "systemicsystolic": 105.0,
      "systemicdiastolic": 68.0,
      "systemicmean": 80.0,
      "lactate": 2.1
    }
    // ... exactly 8 hourly readings ordered chronologically
  ],
  "custom_threshold": 0.5
}
```

**Response:**
```json
{
  "risk_score": 0.847,
  "alert": true,
  "threshold_used": 0.5,
  "attention_weights": [0.08, 0.09, 0.10, 0.11, 0.15, 0.17, 0.14, 0.16]
}
```

---

## 🐙 Git & GitHub Publishing Guide

To push this project to a new repository on your GitHub account, follow these commands:

```bash
# 1. Initialize git in the project root
git init

# 2. Add all files (the included .gitignore will exclude .venv and node_modules)
git add .

# 3. Create initial commit
git commit -m "feat: initial commit for sepsis early warning system"

# 4. Rename branch to main
git branch -M main

# 5. Link your GitHub remote repository (replace with your repository URL)
git remote add origin https://github.com/<your-username>/sepsis-early-warning-system.git

# 6. Push code to GitHub
git push -u origin main
```

---

## ⚖️ License & Disclaimer

This project is licensed under the [MIT License](LICENSE).

### ⚕️ Clinical Disclaimer
This system is an academic research demonstration and is **NOT** a certified medical device (FDA / CE mark). It is not cleared for clinical decision making, diagnosis, or triage. All evaluations were conducted retrospectively.
