/**
 * VitalsTrendChart — recharts LineChart with clickable legend items.
 * Clicking any vital name in the legend opens a small popup card
 * describing what that vital is, its unit, normal range, and clinical
 * relevance to sepsis.
 */

import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { FEATURE_COLS, FEATURE_SHORT, VITAL_DESCRIPTIONS } from "../constants";

const LINE_COLORS = [
  "#ef4444",  // HR
  "#f97316",  // RR
  "#f59e0b",  // Temp
  "#06b6d4",  // SpO₂
  "#3b82f6",  // SysBP
  "#8b5cf6",  // DiaBP
  "#ec4899",  // MAP
  "#22c55e",  // Lactate
];

// ── Popup card ─────────────────────────────────────────────────────────────
function VitalPopup({ feature, color, onClose }) {
  const ref = useRef(null);
  const info = VITAL_DESCRIPTIONS[feature];
  if (!info) return null;

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        bottom: "calc(100% + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: 300,
        background: "var(--bg-card-alt)",
        border: `1px solid ${color}55`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: "14px 16px",
        zIndex: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 8, right: 10,
          background: "none", border: "none",
          color: "var(--text-muted)", cursor: "pointer",
          fontSize: 16, lineHeight: 1,
        }}
        aria-label="Close"
      >×</button>

      {/* Header */}
      <div style={{ color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
        {info.title}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, fontFamily: "monospace" }}>
        Unit: {info.unit} &nbsp;·&nbsp; Normal: {info.normalRange}
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65 }}>
        {info.description}
      </div>
    </div>
  );
}

// ── Custom legend item ──────────────────────────────────────────────────────
function CustomLegend({ payload, activeFeature, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center", paddingTop: 10 }}>
      {payload.map((entry, idx) => {
        const feature = FEATURE_COLS[idx];
        const isActive = activeFeature === feature;
        return (
          <button
            key={feature}
            onClick={() => onSelect(isActive ? null : feature)}
            style={{
              background: isActive ? `${entry.color}22` : "transparent",
              border: isActive ? `1px solid ${entry.color}` : "1px solid transparent",
              borderRadius: 20,
              padding: "2px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: entry.color,
              fontWeight: isActive ? 700 : 400,
              transition: "all 0.15s",
            }}
            title="Click for description"
          >
            <span style={{
              display: "inline-block",
              width: 8, height: 8,
              borderRadius: "50%",
              background: entry.color,
              flexShrink: 0,
            }} />
            {FEATURE_SHORT[feature] || entry.value}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function VitalsTrendChart({ readings }) {
  const [activeFeature, setActiveFeature] = useState(null);
  const wrapRef = useRef(null);

  if (!readings || readings.length === 0) return null;

  const chartData = readings.map((row, i) => ({
    hour: `H${i + 1}`,
    ...Object.fromEntries(
      FEATURE_COLS.map((f) => [f, row[f] !== "" ? row[f] : null])
    ),
  }));

  const activeColor = activeFeature
    ? LINE_COLORS[FEATURE_COLS.indexOf(activeFeature)]
    : null;

  return (
    <div className="card">
      <div className="card-title">
        <span className="icon">📈</span> Vitals Trend — 8-Hour Window
        {activeFeature && (
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400, marginLeft: 8 }}>
            Click a vital again to close its description
          </span>
        )}
      </div>

      {/* Popup + chart wrapper */}
      <div ref={wrapRef} style={{ position: "relative" }}>

        {/* Popup anchored above the chart */}
        {activeFeature && (
          <VitalPopup
            feature={activeFeature}
            color={activeColor}
            onClose={() => setActiveFeature(null)}
          />
        )}

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 24, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3147" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#8b91a8", fontSize: 11 }}
                axisLine={{ stroke: "#2d3147" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#8b91a8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e2130",
                  border: "1px solid #2d3147",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#8b91a8" }}
              />
              <Legend
                content={(props) => (
                  <CustomLegend
                    {...props}
                    activeFeature={activeFeature}
                    onSelect={setActiveFeature}
                  />
                )}
              />
              {FEATURE_COLS.map((f, idx) => (
                <Line
                  key={f}
                  type="monotone"
                  dataKey={f}
                  name={f}
                  stroke={LINE_COLORS[idx]}
                  strokeWidth={activeFeature && activeFeature !== f ? 1 : 2}
                  strokeOpacity={activeFeature && activeFeature !== f ? 0.3 : 1}
                  dot={{ r: 3, fill: LINE_COLORS[idx] }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
        Click any vital name in the legend to learn what it measures.
      </p>
    </div>
  );
}
