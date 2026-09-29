/**
 * VitalsInputPanel — editable 8×8 table of hourly vitals
 *
 * Validation: only blocks physiologically IMPOSSIBLE values
 * (outside ABSOLUTE_LIMITS). Abnormal-but-possible values
 * in sick patients are accepted without any warning.
 *
 * Props:
 *   readings   : array of 8 row-objects (keyed by feature name)
 *   onChange   : (newReadings) => void
 *   onSubmit   : () => void
 *   loading    : bool
 */

import {
  FEATURE_COLS, FEATURE_SHORT, FEATURE_LABELS,
  ABSOLUTE_LIMITS, SAMPLE_PATIENTS,
} from "../constants";

// ── helpers ────────────────────────────────────────────────────────────────

function isImpossible(feature, val) {
  if (val === "" || val === undefined || isNaN(val)) return false;
  const [lo, hi] = ABSOLUTE_LIMITS[feature] ?? [-Infinity, Infinity];
  return val < lo || val > hi;
}

function isComplete(readings) {
  return (
    readings.length === 8 &&
    readings.every((row) =>
      FEATURE_COLS.every((f) => row[f] !== "" && !isNaN(row[f]))
    )
  );
}

function collectImpossible(readings) {
  const errors = [];
  readings.forEach((row, i) => {
    FEATURE_COLS.forEach((f) => {
      const v = parseFloat(row[f]);
      if (isImpossible(f, v)) {
        const [lo, hi] = ABSOLUTE_LIMITS[f];
        errors.push(`H${i + 1} ${FEATURE_SHORT[f]} = ${v}  (must be ${lo}–${hi})`);
      }
    });
  });
  return errors;
}

function blankReadings() {
  return Array.from({ length: 8 }, () =>
    Object.fromEntries(FEATURE_COLS.map((f) => [f, ""]))
  );
}

// ── component ──────────────────────────────────────────────────────────────

export default function VitalsInputPanel({ readings, onChange, onSubmit, loading }) {

  function handleCell(rowIdx, feature, raw) {
    const val = raw === "" ? "" : parseFloat(raw);
    onChange(readings.map((r, i) => i === rowIdx ? { ...r, [feature]: val } : r));
  }

  function loadPreset(key) {
    if (!key) return;
    onChange(SAMPLE_PATIENTS[key].readings);
  }

  const errors    = collectImpossible(readings);
  const hasErrors = errors.length > 0;
  const canSubmit = isComplete(readings) && !hasErrors && !loading;

  return (
    <div className="card">
      <div className="card-title">
        <span className="icon">📋</span> Patient Vitals — 8-Hour Window
      </div>

      {/* Controls row */}
      <div className="table-controls">
        <select
          defaultValue=""
          onChange={(e) => loadPreset(e.target.value)}
        >
          <option value="" disabled>⬇ Load Sample Patient…</option>
          {Object.entries(SAMPLE_PATIENTS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <button className="btn btn-ghost btn-sm" onClick={() => onChange(blankReadings())}>
          Clear
        </button>

        <button
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={!canSubmit}
          title={hasErrors ? "Fix impossible values before running" : ""}
          style={{ marginLeft: "auto" }}
        >
          {loading ? <><span className="spinner" /> Scoring…</> : "▶ Run Prediction"}
        </button>
      </div>

      {/* Table */}
      <div className="vitals-table-wrap">
        <table className="vitals-table">
          <thead>
            <tr>
              <th style={{ width: 56, textAlign: "left", paddingLeft: 10 }}>Hour</th>
              {FEATURE_COLS.map((f) => {
                const [lo, hi] = ABSOLUTE_LIMITS[f] ?? [];
                return (
                  <th key={f} title={`${FEATURE_LABELS[f]}\nValid range: ${lo}–${hi}`}>
                    {FEATURE_SHORT[f]}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {readings.map((row, i) => (
              <tr key={i}>
                <td className="row-label">
                  H{i + 1}
                  {i < 4 && (
                    <span
                      title="Baseline window used for z-score normalization"
                      style={{ color: "var(--accent)", marginLeft: 4, fontSize: 10 }}
                    >★</span>
                  )}
                </td>
                {FEATURE_COLS.map((f) => {
                  const v    = row[f];
                  const bad  = isImpossible(f, parseFloat(v));
                  const [lo, hi] = ABSOLUTE_LIMITS[f] ?? [];
                  return (
                    <td
                      key={f}
                      style={bad ? {
                        outline: "2px solid var(--risk-high)",
                        borderRadius: 4,
                        background: "rgba(239,68,68,0.08)",
                      } : {}}
                    >
                      <input
                        type="number"
                        step="any"
                        value={v === undefined ? "" : v}
                        onChange={(e) => handleCell(i, f, e.target.value)}
                        placeholder="—"
                        title={bad ? `⛔ Value must be between ${lo} and ${hi}` : `${FEATURE_LABELS[f]} (${lo}–${hi})`}
                        style={{ color: bad ? "var(--risk-high)" : "var(--text-primary)" }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error list — only shown when something is impossible */}
      {hasErrors && (
        <div style={{
          marginTop: 12,
          background: "rgba(239,68,68,0.08)",
          border: "1px solid var(--risk-high)",
          borderRadius: 8,
          padding: "10px 14px",
        }}>
          <div style={{ color: "var(--risk-high)", fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
            ⛔ {errors.length} value{errors.length > 1 ? "s are" : " is"} outside the biologically possible range
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "var(--risk-high)", lineHeight: 1.8 }}>
            {errors.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </div>
      )}

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
        ★ Hours 1–4 are the baseline for z-score normalization.
        Hover column headers to see valid ranges.
      </p>
    </div>
  );
}
