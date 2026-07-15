import * as React from "react";
/**
 * Editorial outro highlight panel — peach card with strong + sub lines.
 */
export interface HighlightProps {
  strong: React.ReactNode;
  sub: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Highlight(props: HighlightProps): JSX.Element;
