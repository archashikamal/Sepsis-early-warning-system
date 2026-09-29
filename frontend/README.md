# 💻 Sepsis Early-Warning Frontend Dashboard

A modern, responsive clinical telemetry dashboard built with **React 18**, **Vite**, and **Recharts** designed for intensive care units (ICUs) and emergency departments.

---

## ✨ Features

- **Real-Time Risk Gauge:** Animated radial score visualizer displaying current predicted sepsis probability with clinical triage color-coding (Low, Moderate, High risk).
- **Interactive Threshold Slider:** Dynamic risk threshold tuning that re-evaluates clinical alert triggers client-side instantaneously without redundant API roundtrips.
- **Multivariate Vitals Trend Chart:** Interactive multi-line time series tracking heart rate, respiration, body temperature, oxygen saturation (SpO2), blood pressures, and arterial lactate across the 8-hour window.
- **Temporal Attention Explainability:** Visual bar chart showing the neural network's attention weights across each hour to highlight the exact tipping points driving the clinical score.
- **Pre-Configured Clinical Profiles:** Quick-load buttons for benchmark ICU trajectories:
  - *Septic-Trending* (deteriorating vitals and rising lactate)
  - *Stable Patient* (normative ICU vitals)
  - *Early Recovery* (stabilizing parameters post-intervention)
- **Direct Manual Vitals Entry:** Editable table to simulate custom patient scenarios.

---

## 📁 Directory Structure

```
frontend/
├── public/                 # Static clinical icons and favicons
├── src/
│   ├── assets/             # Brand graphics and badges
│   ├── components/         # Modular dashboard widgets
│   │   ├── AttentionPanel.jsx      # Neural attention weight distribution
│   │   ├── ModelInfoPanel.jsx      # Model metrics, lead-time & AUROC stats
│   │   ├── RiskScoreDisplay.jsx    # Circular gauge & alert banner
│   │   ├── VitalsInputPanel.jsx    # Patient selector and tabular input
│   │   └── VitalsTrendChart.jsx    # Recharts multi-signal trend graph
│   ├── App.css             # Main layout & grid styles
│   ├── App.jsx             # Top-level state container & API coordinator
│   ├── constants.js        # Vitals definitions & preset patient scenarios
│   ├── index.css           # Clinical dark-mode design system
│   └── main.jsx            # Application entrypoint
├── .env.example            # Environment configuration template
├── package.json            # Node dependencies and scripts
├── vite.config.js          # Vite build config
└── README.md               # Frontend documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Ensure `VITE_API_URL` points to your backend instance:
```env
VITE_API_URL=http://localhost:8000
```

### 3. Installation
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📦 Production Build

To compile static assets for production deployment:
```bash
npm run build
```
The optimized bundle will be generated in the `dist/` directory, ready to be served by Nginx, Caddy, Vercel, Netlify, or AWS S3 + CloudFront.

To preview the production build locally:
```bash
npm run preview
```
