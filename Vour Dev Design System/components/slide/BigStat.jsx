import React from "react";

/**
 * BigStat — one standout metric, editorial style.
 *
 * Use for slides whose ENTIRE message is a single number: benchmarks, percentages, cost/time
 * savings, adoption stats. The number is Sora 800 · 240–280px in `--ed-orange`; the unit sits
 * on the right in Sora 700 · 88px; a small mono caption underneath explains the source.
 *
 * Obeys the §17 single-mockup rule: dropped alone into `.diag-wrap`, it fills the full width.
 * Never pair two BigStats side-by-side — use two full slides or a Comparison-Bars instead.
 */
export function BigStat({
  number,           // "3×" · "80%" · "12 detik" · "40k+"
  unit,             // "faster" · "less code" · "developers" — optional
  caption,          // one-line context under the number
  captionEyebrow,   // small orange eyebrow above the caption
  align = "center", // "center" (default) · "left"
  style,
  ...rest
}) {
  const isLeft = align === "left";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: isLeft ? "flex-start" : "center",
        justifyContent: "center",
        gap: 32,
        padding: "40px 32px",
        boxSizing: "border-box",
        borderRadius: "var(--radius-lg)",
        background: "var(--ed-card-peach)",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 20,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(200px, 26vw, 280px)",
            letterSpacing: "-0.03em",
            color: "var(--ed-orange)",
            lineHeight: 0.95,
          }}
        >
          {number}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 88,
              color: "var(--ed-ink)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              maxWidth: 380,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {(caption || captionEyebrow) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: isLeft ? "flex-start" : "center",
            maxWidth: 760,
            textAlign: isLeft ? "left" : "center",
          }}
        >
          {captionEyebrow && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 22,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-eyebrow)",
                color: "var(--ed-orange)",
                lineHeight: 1,
              }}
            >
              {captionEyebrow}
            </span>
          )}
          {caption && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 32,
                fontWeight: 500,
                color: "var(--ed-ink-soft)",
                lineHeight: 1.35,
              }}
            >
              {caption}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
