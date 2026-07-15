import React from "react";

/**
 * DarkCallout — the "Claude reads that description and respects the constraint" banner.
 * Editorial only. Max one per slide.
 */
export function DarkCallout({ icon = "lucide:check-circle", children, style, ...rest }) {
  return (
    <div
      style={{
        background: "var(--ed-callout-ink)",
        color: "#FFFFFF",
        borderRadius: "var(--radius-md)",
        padding: "var(--pad-callout)",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        fontSize: "var(--fs-body)",
        lineHeight: 1.4,
        ...style,
      }}
      {...rest}
    >
      <div style={{
        width: "var(--icon-callout)",     /* 40 */
        height: "var(--icon-callout)",
        borderRadius: 10,
        background: "rgba(255,255,255,0.08)",  /* opaque enough over the ink */
        display: "flex", alignItems: "center", justifyContent: "center",
        flex: "none",
      }}>
        <iconify-icon icon={icon} style={{
          fontSize: 24, width: 24, height: 24, color: "var(--ed-orange)",
        }} />
      </div>
      <div>{children}</div>
    </div>
  );
}
