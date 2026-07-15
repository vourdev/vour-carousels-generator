import React from "react";

/**
 * SplitPanel — text on one side, image / diagram on the other. Fills `.diag-wrap`.
 *
 * Use when both text and mock deserve equal weight. Layout is a 1fr / 1fr grid with
 * `--gap-body-asset` (40px) between the columns. Left = text (headline + body), right = the
 * visual (children — typically an `<ImagePlate>` or a `.terminal`).
 *
 * The text column uses the same headline/body styles as a text-only slide (§3), so the
 * total design language stays consistent.
 */
export function SplitPanel({
  eyebrow,       // small mono ALL CAPS orange
  heading,       // Sora 700 · 48px (below h1 scale — this is a sub-headline)
  body,          // Nunito 500 · 28px · ink-soft (2-3 lines)
  children,      // the right-hand visual (ImagePlate, terminal, diagram, etc.)
  swap = false,  // when true, put the image on the LEFT and text on the RIGHT
  style,
  ...rest
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--gap-body-asset)",
        alignItems: "stretch",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          order: swap ? 2 : 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
          padding: "24px 0",
          minWidth: 0,
        }}
      >
        {eyebrow && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: "var(--tracking-eyebrow)",
              textTransform: "uppercase",
              color: "var(--ed-orange)",
              lineHeight: 1,
            }}
          >
            {eyebrow}
          </span>
        )}
        {heading && (
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 48,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--ed-ink)",
              margin: 0,
              textWrap: "balance",
            }}
          >
            {heading}
          </h2>
        )}
        {body && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 28,
              lineHeight: 1.4,
              color: "var(--ed-ink-soft)",
              margin: 0,
              textWrap: "pretty",
            }}
          >
            {body}
          </p>
        )}
      </div>

      <div
        style={{
          order: swap ? 1 : 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
