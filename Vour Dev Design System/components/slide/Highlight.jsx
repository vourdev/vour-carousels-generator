import React from "react";

/**
 * Highlight — the editorial outro highlight panel.
 * Peach card with an orange "strong line" + soft "sub-line".
 */
export function Highlight({ strong, sub, style, ...rest }) {
  return (
    <div
      style={{
        background: "var(--ed-card-peach)",
        borderRadius: "var(--radius-md)",
        padding: "24px 28px",
        ...style,
      }}
      {...rest}
    >
      <div style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 32,
        lineHeight: 1.2,
        color: "var(--ed-orange)",
      }}>{strong}</div>
      <div style={{
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        fontSize: 26,
        lineHeight: 1.4,
        color: "var(--ed-ink-soft)",
        marginTop: 8,
      }}>{sub}</div>
    </div>
  );
}
