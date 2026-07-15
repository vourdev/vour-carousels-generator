import React from "react";

/**
 * SlideShell — the fixed 1080×1350 editorial canvas.
 * Editorial is the only surface. Cream paper + soft corner halo.
 */
export function SlideShell({
  style,
  children,
  ...rest
}) {
  return (
    <div
      data-surface="editorial"
      style={{
        position: "relative",
        width: 1080,
        height: 1350,
        padding: "var(--pad-ig-top) var(--pad-ig-x) var(--pad-ig-bottom)",
        background: "var(--bg-editorial)",
        color: "var(--ed-ink)",
        fontFamily: "var(--font-body)",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
