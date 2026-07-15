import * as React from "react";

/**
 * ImagePlate — editorial-framed image insert. Use for any screenshot / product shot / illustration
 * on a mockup slide. Wrapped (framed / windowed / phone) by default — matches the diagram card
 * outlines so the slide reads as one composition. Falls back to a placeholder slot when `src` is
 * omitted, so you can lay out a slide before you have the final image.
 */
export interface ImagePlateProps {
  /** Image URL. Omit to render a striped placeholder slot. */
  src?: string;
  alt?: string;
  /** "framed" (default) · "window-mac" · "window-web" · "phone" · "plain". */
  variant?: "framed" | "window-mac" | "window-web" | "phone" | "plain";
  /** `object-fit` on the inner `<img>`. Default "cover"; use "contain" for logos/screenshots
   *  with important edges. */
  fit?: "cover" | "contain";
  /** CSS aspect-ratio (e.g. "16 / 10"). If unset, the plate fills its wrapper (use inside `.diag-wrap`). */
  ratio?: string;
  /** Window title text (window-mac / window-web). */
  chromeLabel?: string;
  /** URL pill text (window-web). */
  url?: string;
  /** Small mono caption below the plate. */
  caption?: React.ReactNode;
  /** Orange all-caps eyebrow above the caption. */
  captionEyebrow?: string;
  /** Alternate content INSIDE the plate (skips the `<img>`). Use for custom mockups. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function ImagePlate(props: ImagePlateProps): JSX.Element;

/**
 * Side-by-side pair of ImagePlates (equal columns). For before/after or option comparisons.
 */
export interface ImagePlatePairProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function ImagePlatePair(props: ImagePlatePairProps): JSX.Element;
