import React from "react";

/**
 * ImagePlate — the editorial way to put a screenshot / product shot / illustration on a slide.
 *
 * WHY WRAPPED (default): on cream `--ed-paper` an un-framed screenshot reads as pasted-in.
 * A thin `--ed-ink` outline + warm shadow echoes the diagram cards, so screenshots sit inside
 * the slide's composition instead of on top of it.
 *
 * Variants:
 *   • "framed"      — default. Ink outline + rounded corners + soft shadow. Any image.
 *   • "window-mac"  — adds a top chrome bar with traffic-light dots. For app / IDE / terminal shots.
 *   • "window-web"  — adds a top chrome bar with dots + URL pill. For web-app screenshots.
 *   • "phone"       — narrow rounded frame with an ink outline + notch. For mobile screens.
 *   • "plain"       — no border, just rounded corners + soft shadow. For logos and isolates.
 *
 * Slot into a diagram slide via `.diag-wrap` (or use as your `.diag-wrap` replacement — it obeys
 * the mockup proportion contract). Optional caption below.
 */
export function ImagePlate({
  src,
  alt = "",
  variant = "framed",
  fit = "cover",
  ratio,            // e.g. "16 / 10", "4 / 3", "9 / 16". If unset, plate fills its wrapper.
  chromeLabel,      // window title on window-mac / window-web
  url,              // URL pill on window-web
  caption,          // small mono caption under the plate
  captionEyebrow,   // orange eyebrow above the caption
  children,         // if you pass children, they render inside the plate INSTEAD of an <img> (custom mock content)
  style,
  ...rest
}) {
  const isWindow = variant === "window-mac" || variant === "window-web";
  const isPhone  = variant === "phone";

  return (
    <figure
      style={{
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: caption || captionEyebrow ? "var(--gap-small)" : 0,
        width: "100%",
        alignItems: isPhone ? "center" : "stretch",
        ...style,
      }}
      {...rest}
    >
      <div
        data-variant={variant}
        style={{
          borderRadius: isPhone ? 44 : "var(--radius-lg)",
          overflow: "hidden",
          background: variant === "plain" ? "transparent" : "var(--ed-paper)",
          border: variant === "plain" ? "none"
                : isPhone           ? "4px solid var(--ed-ink)"
                                    : "1.5px solid var(--ed-ink)",
          boxShadow: variant === "plain"
            ? "0 10px 24px -8px rgba(31,9,4,0.14)"
            : "0 22px 44px -14px rgba(31,9,4,0.20), 0 4px 12px rgba(31,9,4,0.05)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: isPhone ? 340 : "100%",
          maxWidth: isPhone ? 380 : "100%",
          height: ratio ? undefined : "100%",
          aspectRatio: ratio,
        }}
      >
        {variant === "window-mac" && (
          <ImagePlateChrome variant="mac" label={chromeLabel} />
        )}
        {variant === "window-web" && (
          <ImagePlateChrome variant="web" label={chromeLabel} url={url} />
        )}
        {isPhone && (
          <div style={{
            position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
            width: 100, height: 22, background: "var(--ed-ink)", borderRadius: 12, zIndex: 3,
          }} />
        )}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background: isPhone ? "var(--ed-ink)" : "var(--ed-paper)",
            padding: isPhone ? "12px 10px" : 0,
          }}
        >
          <div style={{
            flex: 1, width: "100%", height: "100%",
            borderRadius: isPhone ? 30 : 0,
            overflow: "hidden",
            background: "var(--ed-paper)",
            display: "flex",
          }}>
            {children ?? (
              src
                ? <img
                    src={src} alt={alt}
                    style={{
                      display: "block",
                      width: "100%", height: "100%",
                      objectFit: fit,
                      objectPosition: "center top",
                    }}
                  />
                : <ImagePlateSlot />
            )}
          </div>
        </div>
      </div>
      {(captionEyebrow || caption) && (
        <figcaption style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-caption)",
          color: "var(--ed-ink-muted)",
          lineHeight: 1.4,
        }}>
          {captionEyebrow && (
            <span style={{
              display: "block",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-eyebrow)",
              color: "var(--ed-orange)",
              fontSize: 20,
              marginBottom: 4,
            }}>{captionEyebrow}</span>
          )}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Two-frame side-by-side layout for before/after or option comparisons. */
export function ImagePlatePair({ children, style, ...rest }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--gap-body-asset)",
        alignItems: "stretch",
        width: "100%",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─────────── internals ─────────── */

function ImagePlateChrome({ variant, label, url }) {
  return (
    <div style={{
      background: "var(--ed-card-stone)",
      borderBottom: "1px solid rgba(31,9,4,0.10)",
      padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 14,
      flex: "none", height: 52,
    }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "none" }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F56" }} />
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#27C93F" }} />
      </div>
      {variant === "web" ? (
        <div style={{
          flex: 1, minWidth: 0,
          background: "var(--ed-paper)",
          border: "1px solid rgba(31,9,4,0.08)",
          borderRadius: 8,
          padding: "6px 14px",
          fontFamily: "var(--font-mono)",
          fontWeight: 500, fontSize: 18,
          color: "var(--ed-ink-muted)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          lineHeight: 1.4,
        }}>{url ?? "app.example.com"}</div>
      ) : (
        <div style={{
          flex: 1, textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 18, fontWeight: 500,
          color: "var(--ed-ink-soft)",
          lineHeight: 1,
        }}>{label ?? ""}</div>
      )}
    </div>
  );
}

function ImagePlateSlot() {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 14,
      background:
        "repeating-linear-gradient(-45deg, rgba(31,9,4,0.03) 0 14px, rgba(31,9,4,0.06) 14px 28px)",
      padding: 32, textAlign: "center",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 500,
        textTransform: "uppercase", letterSpacing: "var(--tracking-eyebrow)",
        color: "var(--ed-orange)", lineHeight: 1,
      }}>[image]</span>
      <span style={{
        fontFamily: "var(--font-body)", fontSize: 24, fontWeight: 500,
        color: "var(--ed-ink-soft)", maxWidth: 340, lineHeight: 1.4,
      }}>Drop screenshot / product shot here</span>
    </div>
  );
}
