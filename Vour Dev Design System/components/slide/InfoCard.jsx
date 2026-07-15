import React from "react";

const CARD_BG = {
  peach: "var(--ed-card-peach)",
  stone: "var(--ed-card-stone)",
  mint:  "var(--ed-card-mint)",
  sky:   "var(--ed-card-sky)",
  pink:  "var(--ed-card-pink)",
  amber: "var(--ed-card-amber)",
};

const ACCENT_TEXT = {
  peach: "var(--ed-orange)",
  stone: "var(--ed-ink-faint)",
  mint:  "#1F7A3D",
  sky:   "#1F4A8A",
  pink:  "#A8366E",
  amber: "#7A5A14",
};

/**
 * InfoCard — editorial workhorse. Opaque pastel fill (never transparent).
 * Update 2: always one of the --ed-card-* family, picked by `tone`.
 */
export function InfoCard({
  tone = "peach",
  icon,
  title,
  body,
  label,           // small mono label at the top — used for SCRAPED/DESIGNED
  labelTone,       // override label color
  children,
  style,
  ...rest
}) {
  const accent = ACCENT_TEXT[tone] ?? ACCENT_TEXT.peach;
  return (
    <div
      style={{
        background: CARD_BG[tone] ?? CARD_BG.peach,
        borderRadius: "var(--radius-lg)",
        padding: "var(--pad-card)",
        ...style,
      }}
      {...rest}
    >
      {label && (
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-eyebrow-ed)",
          fontWeight: 500,
          letterSpacing: "var(--tracking-eyebrow-ed)",
          textTransform: "uppercase",
          color: labelTone ?? accent,
          marginBottom: 16,
        }}>{label}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(icon || title) && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {icon && (
              <div style={{
                width: "var(--icon-ed-card)",     /* 48 */
                height: "var(--icon-ed-card)",
                borderRadius: "var(--radius-xs)",
                background: "var(--ed-icon-tile-bg)", /* opaque — Update 2 */
                display: "flex", alignItems: "center", justifyContent: "center",
                flex: "none",
              }}>
                <iconify-icon icon={icon} style={{
                  fontSize: "var(--icon-ed-glyph)", /* 24 */
                  width: "var(--icon-ed-glyph)",
                  height: "var(--icon-ed-glyph)",
                  color: "var(--ed-orange)",
                }} />
              </div>
            )}
            {title && (
              <div style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "var(--fs-h3)",
                lineHeight: 1.15,
                color: "var(--ed-ink)",
              }}>{title}</div>
            )}
          </div>
        )}
        {body && (
          <div style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: "var(--fs-body)",
            lineHeight: 1.4,
            color: "var(--ed-ink-soft)",
            marginTop: 8,
          }}>{body}</div>
        )}
        {children}
      </div>
    </div>
  );
}
