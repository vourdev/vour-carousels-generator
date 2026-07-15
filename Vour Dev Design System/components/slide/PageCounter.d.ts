import * as React from "react";
/**
 * Two-digit page counter. "01 / 10". Top-left of every non-cover slide.
 */
export interface PageCounterProps {
  index: number;
  total: number;
  style?: React.CSSProperties;
}
export declare function PageCounter(props: PageCounterProps): JSX.Element;
