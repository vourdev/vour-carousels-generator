import React from "react";

/**
 * NumberedStep — orange-circled numbered card on a peach background.
 * Update 2: badge is 40px (was 36); title 32px; body 28px.
 */
export function NumberedStep({ n, title, body, tone = "peach", style, ...rest }) {
  return (
    <div
      style={{
        background: tone === "peach" ? "var(--ed-card-peach)" : `var(--ed-card-${tone})`,
        borderRadius: "var(--radius-md)",
        padding: "var(--pad-card)",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 20,
        ...style,
      }}
      {...rest}
    >
      <div style={{
        width: "var(--icon-step-badge)",   /* 40 */
        height: "var(--icon-step-badge)",
        borderRadius: "50%",
        background: "var(--ed-orange)",
        color: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 22,
        lineHeight: 1,
        flex: "none",
      }}>{n}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1.15,
          color: "var(--ed-ink)",
        }}>{title}</div>
        <div style={{
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: "var(--fs-body)",
          lineHeight: 1.4,
          color: "var(--ed-ink-soft)",
        }}>{body}</div>
      </div>
    </div>
  );
}
