import React from "react";

/**
 * A hand-drawn-instrument-style semi-circular dial, styled after a
 * surveyor's measuring gauge rather than a glossy dashboard widget —
 * it's the one deliberately bold element on the page, everything else
 * stays quiet around it.
 *
 * score: 0-100 or null (no data)
 */
export default function Gauge({ score }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const radius = 84;

  const zoneColor = (s) => {
    if (s === null) return "#9aa39a";
    if (s >= 80) return "#3f6650";
    if (s >= 55) return "#b8862e";
    return "#9c3b33";
  };

  const zoneLabel = (s) => {
    if (s === null) return "No data";
    if (s >= 80) return "Clean";
    if (s >= 55) return "Mixed";
    return "Flagged";
  };

  // angle: 180deg (score 0) -> 0deg (score 100), sweeping left to right
  const angleForScore = (s) => 180 - (Math.max(0, Math.min(100, s ?? 0)) / 100) * 180;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const needleAngle = angleForScore(score);
  const needleLen = radius - 14;
  const needleX = cx + needleLen * Math.cos(toRad(needleAngle));
  const needleY = cy - needleLen * Math.sin(toRad(needleAngle));

  const ticks = [0, 20, 40, 60, 80, 100];

  const arcPoint = (deg, r) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy - r * Math.sin(toRad(deg)),
  });

  const color = zoneColor(score);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size / 2 + 34} viewBox={`0 0 ${size} ${size / 2 + 34}`}>
        {/* base arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#d7dace"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* colored progress arc, only up to the score */}
        {score !== null && (
          <path
            d={(() => {
              const start = arcPoint(180, radius);
              const end = arcPoint(needleAngle, radius);
              const largeArc = 180 - needleAngle > 180 ? 1 : 0;
              return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
            })()}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}

        {/* tick marks */}
        {ticks.map((t) => {
          const deg = angleForScore(t);
          const inner = arcPoint(deg, radius - 16);
          const outer = arcPoint(deg, radius - 8);
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#96a094"
              strokeWidth="1.5"
            />
          );
        })}

        {/* needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#1b2a22"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill="#1b2a22" />

        {/* score readout */}
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace"
          fontSize="30"
          fontWeight="600"
          fill="#1b2a22"
        >
          {score === null ? "—" : score}
        </text>
      </svg>
      <div
        style={{
          fontFamily: "IBM Plex Mono, monospace",
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color,
          marginTop: "2px",
        }}
      >
        {zoneLabel(score)}
      </div>
    </div>
  );
}
