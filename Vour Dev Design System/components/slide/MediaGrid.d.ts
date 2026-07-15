import * as React from "react";

/**
 * MediaGrid — 2×2 (or 1×3 / 1×4) grid of `ImagePlate`s.
 * Every cell should use the SAME `ImagePlate` variant.
 * Fills `.diag-wrap`; obeys §14 and §17.
 */
export interface MediaGridProps {
  /** 3–4 `ImagePlate`s. Warns in console if more than 4. */
  children: React.ReactNode;
  /** Column count: 1 · 2 (default) · 3 · 4. */
  columns?: 1 | 2 | 3 | 4;
  /** Gap override in px or CSS. Default: `--gap-body-asset` (40). */
  gap?: string | number;
  style?: React.CSSProperties;
}
export declare function MediaGrid(props: MediaGridProps): JSX.Element;
