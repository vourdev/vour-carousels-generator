import React from "react";

/**
 * Eyebrow — the ALL CAPS line above the headline.
 * JetBrains Mono · --ed-orange · 24px · tracking 0.18em.
 */
export function Eyebrow({ children, style, ...rest }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: "var(--fs-eyebrow)",
        letterSpacing: "var(--tracking-eyebrow)",
        textTransform: "uppercase",
        color: "var(--ed-orange)",
        lineHeight: 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
