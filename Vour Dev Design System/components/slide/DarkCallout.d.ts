import * as React from "react";
/**
 * The dark "land the take" banner — editorial only.
 */
export interface DarkCalloutProps {
  /** Iconify name. Default lucide:check-circle. */
  icon?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function DarkCallout(props: DarkCalloutProps): JSX.Element;
