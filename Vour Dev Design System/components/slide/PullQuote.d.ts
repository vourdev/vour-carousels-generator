import * as React from "react";

/**
 * PullQuote — a standout quote, testimonial, or expert claim.
 * 96px orange quote-mark glyph + Sora 700 · 56px body + mono attribution.
 * Fills its wrapper (place inside `.diag-wrap` on a mockup slide; §17 applies).
 */
export interface PullQuoteProps {
  /** The quote body. Plain string or JSX (wrap one word in `<span className="a">` for accent). */
  children: React.ReactNode;
  /** Author name. Rendered as ALL CAPS orange mono. */
  author?: string;
  /** Author role / affiliation. Rendered as Nunito 500 · 24px ink-muted. */
  role?: string;
  /** Alignment: "left" (default) or "center". */
  align?: "left" | "center";
  style?: React.CSSProperties;
}
export declare function PullQuote(props: PullQuoteProps): JSX.Element;
