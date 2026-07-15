import React from "react";

/**
 * PullQuote — a standout quote, testimonial, or expert claim.
 *
 * Anatomy: one 96px orange quote-mark glyph, quote body Sora 700 · 56px in `--ed-ink`, and an
 * author + role line in JetBrains Mono. One `<span class="a">` inside the body is allowed — same
 * accent rule as a headline. Fills `.diag-wrap`; obeys §17 single-mockup rule.
 */
export function PullQuote({
  children,        // the quote body — plain string or JSX with <span className="a">
  author,          // "Dan Abramov"
  role,            // "React Core Team"
  align = "left",  // "left" (default) · "center"
  style,
  ...rest
}) {
  const isCenter = align === "center";
  return (
    <blockquote
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: isCenter ? "center" : "flex-start",
        gap: 32,
        padding: "48px 40px",
        margin: 0,
        boxSizing: "border-box",
        borderRadius: "var(--radius-lg)",
        background: "var(--ed-card-peach)",
        position: "relative",
        ...style,
      }}
      {...rest}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 128,
          lineHeight: 0.7,
          color: "var(--ed-orange)",
          letterSpacing: "-0.06em",
          alignSelf: isCenter ? "center" : "flex-start",
        }}
      >
        “
      </span>

      <p
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.18,
          color: "var(--ed-ink)",
          letterSpacing: "-0.015em",
          margin: 0,
          maxWidth: 820,
          textAlign: isCenter ? "center" : "left",
          textWrap: "pretty",
        }}
      >
        {children}
      </p>

      {(author || role) && (
        <footer
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: isCenter ? "center" : "flex-start",
            textAlign: isCenter ? "center" : "left",
          }}
        >
          {author && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
                fontSize: 24,
                letterSpacing: "var(--tracking-eyebrow)",
                textTransform: "uppercase",
                color: "var(--ed-orange)",
                lineHeight: 1,
              }}
            >
              — {author}
            </span>
          )}
          {role && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 24,
                color: "var(--ed-ink-muted)",
                lineHeight: 1.3,
              }}
            >
              {role}
            </span>
          )}
        </footer>
      )}
    </blockquote>
  );
}
