import React from "react";

/**
 * PageCounter — top-left "01 / 10". JetBrains Mono, editorial faint ink.
 */
export function PageCounter({ index, total, style, ...rest }) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 400,
        fontSize: "var(--fs-counter)",
        letterSpacing: "0.04em",
        color: "var(--ed-ink-faint)",
        lineHeight: 1,
        ...style,
      }}
      {...rest}
    >
      {pad(index)} / {pad(total)}
    </div>
  );
}
