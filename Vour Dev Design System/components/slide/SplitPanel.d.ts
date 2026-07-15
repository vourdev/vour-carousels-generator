import * as React from "react";

/**
 * SplitPanel — text on one side, image / diagram on the other.
 * 1fr / 1fr grid with `--gap-body-asset` between columns.
 * Left = eyebrow + heading + body; Right = the visual (children).
 * Fills `.diag-wrap`; obeys §14 and §17.
 */
export interface SplitPanelProps {
  /** Small orange mono ALL-CAPS eyebrow above the heading. */
  eyebrow?: string;
  /** Sub-headline (Sora 700 · 48px · ink). Note: NOT h1 scale — the slide already has an h1. */
  heading?: React.ReactNode;
  /** Body copy (Nunito 500 · 28px · ink-soft). ≤ 3 lines. */
  body?: React.ReactNode;
  /** The right-hand visual. Usually an `<ImagePlate>` or a `.terminal`. */
  children: React.ReactNode;
  /** Swap the order: image on the LEFT, text on the RIGHT. */
  swap?: boolean;
  style?: React.CSSProperties;
}
export declare function SplitPanel(props: SplitPanelProps): JSX.Element;
