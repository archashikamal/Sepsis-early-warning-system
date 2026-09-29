/**
 * App.jsx — Root component and application state manager
 *
 * State:
 *   readings   : 8×8 vitals grid
 *   result     : API response { risk_score, alert, attention_weights }
 *   threshold  : alert threshold (client-side, no re-call needed)
 *   loading    : bool
 *   error      : string | null
 */

import { useState } from "react";
import VitalsInputPanel  from "./components/VitalsInputPanel";
import RiskScoreDisplay  from "./components/RiskScoreDisplay";
import VitalsTrendChart  from "./components/VitalsTrendChart";
import AttentionPanel    from "./components/AttentionPanel";
import ModelInfoPanel    from "./components/ModelInfoPanel";
import { FEATURE_COLS }  from "./constants";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Initial blank readings
function blankReadings() {
  return Array.from({ length: 8 }, () =>
    Object.fromEntries(FEATURE_COLS.map((f) => [f, ""]))
  );
}

export default function App() {
  const [readings,  setReadings]  = useState(blankReadings);
  const [result,    setResult]    = useState(null);
  const [threshold, setThreshold] = useState(0.5);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const body = { readings: readings.map((r) =>
        Object.fromEntries(FEATURE_COLS.map((f) => [f, parseFloat(r[f])]))
      )};

      const resp = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
        throw new Error(detail.detail ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ===== Header ===== */}
      <header className="app-header">
        <span className="pulse-dot" />
        <h1>Sepsis Early-Warning System</h1>
        <span className="subtitle">
          ICU Deterioration Monitor · AttnLSTM · Research Prototype
        </span>
      </header>

      {/* ===== Error banner ===== */}
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid var(--risk-high)",
            borderRadius: "var(--radius)",
            padding: "12px 32px",
            color: "var(--risk-high)",
            fontSize: 13,
            margin: "16px 32px 0",
          }}
        >
          <strong>API Error:</strong> {error}
        </div>
      )}

      {/* ===== Main layout ===== */}
      <div className="app-body">
        {/* LEFT column */}
        <div className="col-left">
          <VitalsInputPanel
            readings={readings}
            onChange={setReadings}
            onSubmit={handleSubmit}
            loading={loading}
          />
          <VitalsTrendChart readings={readings} />
          <AttentionPanel weights={result?.attention_weights} />
        </div>

        {/* RIGHT column */}
        <div className="col-right">
          <RiskScoreDisplay
            result={result}
            threshold={threshold}
            onThreshold={setThreshold}
          />
          <ModelInfoPanel />
        </div>
      </div>
    </>
  );
}
