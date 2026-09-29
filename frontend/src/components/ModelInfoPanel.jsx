/**
 * ModelInfoPanel — fetches GET /model-info and displays architecture + metrics.
 * Also contains the required research-prototype disclaimer.
 */

import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ModelInfoPanel() {
  const [info, setInfo]     = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/model-info`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setInfo(d.metadata))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="card">
        <div className="card-title">Model Info</div>
        <p style={{ color: "var(--risk-high)", fontSize: 12 }}>
          Could not reach backend: {error}
          <br />
          <span style={{ color: "var(--text-muted)" }}>
            Make sure the backend is running on {API_BASE}
          </span>
        </p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="card">
        <div className="card-title">Model Info</div>
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading model info…</p>
      </div>
    );
  }

  const cfg     = info.model_config   || {};
  const metrics = info.test_metrics   || {};
  const prep    = info.preprocessing  || {};

  return (
    <div className="card">
      <div className="card-title">
        Deployed Model
      </div>

      {/* Architecture badge */}
      <div className="arch-badge">
        {cfg.model_type || "Unknown"}
        <span style={{ color: "#8b91a8", fontWeight: 400 }}>
          &nbsp;· h={cfg.hidden_size} · L={cfg.num_layers}
        </span>
      </div>

      {/* Validated metrics */}
      <div className="metric-grid">
        <div className="metric-cell">
          <div className="metric-name">Test AUROC</div>
          <div className="metric-val">
            {metrics.test_auroc != null
              ? metrics.test_auroc.toFixed(4)
              : "—"}
          </div>
        </div>
        <div className="metric-cell">
          <div className="metric-name">Test AUPRC</div>
          <div className="metric-val">
            {metrics.test_auprc != null
              ? metrics.test_auprc.toFixed(4)
              : "—"}
          </div>
        </div>
        <div className="metric-cell">
          <div className="metric-name">Median Lead Time</div>
          <div className="metric-val">
            {metrics.median_lead_time_hours ?? "—"}
            <span className="metric-unit">hr</span>
          </div>
        </div>
        <div className="metric-cell">
          <div className="metric-name">False Alarms / pt-day</div>
          <div className="metric-val">
            {metrics.false_alarms_per_patient_day != null
              ? metrics.false_alarms_per_patient_day.toFixed(2)
              : "—"}
          </div>
        </div>
      </div>

      {/* Preprocessing summary */}
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.6 }}>
        <strong>Input window:</strong> {prep.lookback_hours ?? 8} hours ·
        {" "}<strong>Baseline:</strong> first {prep.baseline_hours ?? 4} hrs (z-score ref) ·
        {" "}<strong>Horizon:</strong> {prep.horizon_hours ?? 6} hr ahead
      </div>


    </div>
  );
}
