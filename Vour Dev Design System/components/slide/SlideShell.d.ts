import * as React from "react";

/**
 * The fixed 1080×1350 editorial canvas for every Vour Dev slide.
 * Cream paper + soft corner halo. Editorial is the only surface.
 *
 * @startingPoint section="Slides" subtitle="Empty editorial slide shell (1080×1350)" viewport="1080x1350"
 */
export interface SlideShellProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function SlideShell(props: SlideShellProps): JSX.Element;
