import React from "react";

/**
 * A semi-circular dial reading the signal score — the page's one
 * deliberately bold focal point, everything else stays quiet around it.
 *
 * Zone colors are mapped onto the documented brand palette rather than
 * a conventional red/amber/green scale, since the design system doesn't
 * define a separate semantic color set for this kind of surface:
 *   Clean   -> primary indigo (the brand's own "good" signal)
 *   Mixed   -> lemon (documented warm/sherbet accent)
 *   Flagged -> ruby (documented accent, used here as the alert tone)
 * The zone label carries the actual meaning; color is a secondary cue.
 *
 * score: 0-100 or null (no data)
 */
export default function Gauge({ score }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const radius = 84;

  const zoneColor = (s) => {
    if (s === null) return "#64748d"; // ink-mute
    if (s >= 80) return "#533afd"; // primary (indigo)
    if (s >= 55) return "#9b6829"; // lemon
    return "#ea2261"; // ruby
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
          stroke="#e3e8ee"
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
              stroke="#a8c3de"
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
          stroke="#0d253d"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill="#0d253d" />

        {/* score readout — tabular figures, per the brand's numeric-type rule */}
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="32"
          fontWeight="300"
          letterSpacing="-0.6"
          style={{ fontFeatureSettings: '"tnum"' }}
          fill="#0d253d"
        >
          {score === null ? "—" : score}
        </text>
      </svg>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          fontWeight: 400,
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
