import * as React from "react";

/**
 * BigStat — one standout metric, editorial style.
 * Sora 800 · 240–280px number in `--ed-orange`, optional unit in Sora 700 · 88px,
 * small mono caption underneath. Fills its wrapper (place inside `.diag-wrap` on
 * a mockup slide — §17 single-mockup rule applies).
 */
export interface BigStatProps {
  /** The number itself. Keep short: "3×" · "80%" · "12 detik" · "40k+". */
  number: React.ReactNode;
  /** Optional unit next to the number: "faster" · "less code" · "developers". */
  unit?: React.ReactNode;
  /** One-line caption under the number. */
  caption?: React.ReactNode;
  /** Small orange eyebrow above the caption (mono, ALL CAPS). */
  captionEyebrow?: string;
  /** Alignment: "center" (default) or "left". */
  align?: "center" | "left";
  style?: React.CSSProperties;
}
export declare function BigStat(props: BigStatProps): JSX.Element;
