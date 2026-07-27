import React from "react";

/**
 * The gradient mesh backdrop — pastel cream through sherbet, lavender,
 * indigo, and ruby pink, blurred horizontally across the hero. Built as
 * an SVG with blurred organic blobs rather than a flat CSS gradient,
 * per the design system's note that the real mesh isn't CSS-renderable.
 *
 * Scoped to only the documented brand tokens: canvas-cream (cream stop),
 * lemon (sherbet-orange stop), primary-bg-subdued-hover (lavender stop —
 * the palest indigo token available), primary (indigo stop), and ruby
 * (ruby-pink stop).
 */
export default function GradientMesh() {
  return (
    <svg
      className="gradient-mesh"
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="meshBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="70" />
        </filter>
      </defs>
      <rect width="1200" height="420" fill="#ffffff" />
      <g filter="url(#meshBlur)">
        <ellipse cx="90" cy="150" rx="260" ry="200" fill="#f5e9d4" />
        <ellipse cx="360" cy="80" rx="240" ry="190" fill="#9b6829" opacity="0.55" />
        <ellipse cx="620" cy="220" rx="260" ry="210" fill="#b9b9f9" opacity="0.9" />
        <ellipse cx="880" cy="90" rx="270" ry="200" fill="#533afd" opacity="0.8" />
        <ellipse cx="1130" cy="230" rx="240" ry="210" fill="#ea2261" opacity="0.55" />
      </g>
    </svg>
  );
}
