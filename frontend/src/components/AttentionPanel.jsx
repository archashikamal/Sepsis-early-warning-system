/**
 * AttentionPanel — bar chart of per-hour attention weights from the AttnLSTM model.
 * Only rendered when the API returns non-null attention_weights.
 *
 * Props:
 *   weights: number[] of length 8 (sums to ~1.0), or null
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, ReferenceLine,
} from "recharts";

export default function AttentionPanel({ weights }) {
  if (!weights || weights.length === 0) return null;

  const maxIdx = weights.indexOf(Math.max(...weights));

  const data = weights.map((w, i) => ({
    hour: `Hour ${i + 1}`,
    weight: parseFloat(w.toFixed(4)),
    isPeak: i === maxIdx,
  }));

  // Custom bar label
  const renderLabel = ({ x, y, width, value }) => (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#8b91a8"
      fontSize={10}
      textAnchor="middle"
    >
      {(value * 100).toFixed(1)}%
    </text>
  );

  return (
    <div className="card">
      <div className="card-title">
        Attention Weights — Which Hours Drove the Alert?
      </div>

      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
        The model's attention mechanism assigns a weight to each input hour.
        Taller bars = that hour had more influence on the risk score.{" "}
        <strong style={{ color: "var(--risk-high)" }}>
          Hour {maxIdx + 1}
        </strong>{" "}
        received the highest attention ({(weights[maxIdx] * 100).toFixed(1)}%).
      </p>

      <div className="chart-container-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 24, right: 16, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3147" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#8b91a8", fontSize: 11 }}
              axisLine={{ stroke: "#2d3147" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: "#8b91a8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, Math.max(...weights) * 1.25]}
            />
            <Tooltip
              contentStyle={{
                background: "#1e2130",
                border: "1px solid #2d3147",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(val) => [`${(val * 100).toFixed(2)}%`, "Attention"]}
              labelStyle={{ color: "#8b91a8" }}
            />
            {/* Uniform threshold: 1/8 = 12.5% */}
            <ReferenceLine
              y={1 / 8}
              stroke="#3b82f6"
              strokeDasharray="4 4"
              label={{ value: "Uniform (12.5%)", position: "right", fill: "#3b82f6", fontSize: 9 }}
            />
            <Bar dataKey="weight" radius={[4, 4, 0, 0]} label={renderLabel}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isPeak ? "var(--risk-high)" : "var(--accent)"}
                  fillOpacity={entry.isPeak ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        Blue dashed line = uniform 12.5% (if the model treated all hours equally).
        Bars above it represent hours the model focused on more than average.
        Weights sum to 100%.
      </p>
    </div>
  );
}
