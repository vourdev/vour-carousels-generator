import * as React from "react";
/**
 * Orange-circled numbered step card. Stack three of them with 16 gap.
 */
export interface NumberedStepProps {
  n: number | string;
  title: React.ReactNode;
  body: React.ReactNode;
  tone?: "peach" | "stone" | "mint" | "sky" | "pink" | "amber";
  style?: React.CSSProperties;
}
export declare function NumberedStep(props: NumberedStepProps): JSX.Element;
