/**
 * RiskScoreDisplay — large color-coded risk gauge, alert banner, threshold slider
 *
 * Props:
 *   result     : { risk_score, alert, attention_weights } | null
 *   threshold  : float (0–1)
 *   onThreshold: (val) => void
 */

export default function RiskScoreDisplay({ result, threshold, onThreshold }) {
  const score  = result?.risk_score ?? null;
  const alerted = score !== null && score >= threshold;

  const color =
    score === null ? "var(--text-muted)" :
    score < 0.3   ? "var(--risk-low)" :
    score < 0.6   ? "var(--risk-med)" :
                    "var(--risk-high)";

  const bgColor =
    score === null ? "transparent" :
    score < 0.3   ? "var(--risk-low-bg)" :
    score < 0.6   ? "var(--risk-med-bg)" :
                    "var(--risk-high-bg)";

  const riskLabel =
    score === null     ? "—"          :
    score < 0.3        ? "LOW RISK"   :
    score < 0.6        ? "MODERATE"   :
                         "HIGH RISK";

  return (
    <div className="card">
      <div className="card-title">
        Sepsis Risk Score
      </div>

      {/* Big number */}
      <div className="risk-score-wrap">
        <div
          className="risk-value"
          style={{ color, textShadow: score !== null ? `0 0 40px ${color}55` : "none" }}
        >
          {score !== null ? score.toFixed(3) : "—"}
        </div>
        <div className="risk-label" style={{ color }}>{riskLabel}</div>
      </div>

      {/* Gradient bar */}
      <div className="risk-bar-track">
        <div
          className="risk-bar-fill"
          style={{
            width: `${(score ?? 0) * 100}%`,
            background: `linear-gradient(90deg, var(--risk-low), var(--risk-med), var(--risk-high))`,
          }}
        />
        {/* Threshold marker */}
        <div
          className="risk-bar-thumb"
          style={{ left: `calc(${threshold * 100}% - 1px)` }}
          title={`Alert threshold: ${threshold.toFixed(2)}`}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>
        <span>0.0</span>
        <span style={{ color: "var(--accent)", fontSize: 11 }}>
          threshold {threshold.toFixed(2)}
        </span>
        <span>1.0</span>
      </div>

      {/* Alert banner */}
      {score !== null && (
        <div className={`alert-banner ${alerted ? "alert-active" : "alert-clear"}`}>
          <span className="alert-icon" style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", marginRight: 6 }}>
            {alerted ? "ALERT" : "NORMAL"}
          </span>
          {alerted
            ? `— Risk ${score.toFixed(3)} ≥ threshold ${threshold.toFixed(2)}`
            : `— Risk ${score.toFixed(3)} < threshold ${threshold.toFixed(2)}`}
        </div>
      )}

      {/* Threshold slider */}
      <div className="threshold-row">
        <label>Alert Threshold</label>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.01}
          value={threshold}
          onChange={(e) => onThreshold(parseFloat(e.target.value))}
        />
        <span className="threshold-val">{threshold.toFixed(2)}</span>
      </div>

      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        Slide the threshold — alert status updates instantly without re-calling the API.
      </p>
    </div>
  );
}
