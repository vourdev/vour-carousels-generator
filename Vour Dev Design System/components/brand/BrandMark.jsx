import React from "react";

/**
 * BrandMark — the @vourdev logo disc.
 * Always loads the JPEG at the path given (default: assets/vourdev-logo.jpeg).
 * Never substitute the mark with letters, SVG, or a "VD" wordmark.
 */
export function BrandMark({ size = 72, image = "assets/vourdev-logo.jpeg", alt = "@vourdev", style, ...rest }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: "#07070e",
        flex: "none",
        ...style,
      }}
      {...rest}
    >
      <img src={image} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}

/**
 * BrandHeader — disc + @vourdev wordmark on one row.
 * Used on cover + outro slides. Editorial ink text.
 */
export function BrandHeader({ size = 72, image, style, ...rest }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--gap-small)", ...style }} {...rest}>
      <BrandMark size={size} image={image} />
      <span style={{
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 32,
        color: "var(--ed-ink)",
        lineHeight: 1,
      }}>@vourdev</span>
    </div>
  );
}
