import * as React from "react";

/**
 * The @vourdev logo disc. Always uses the JPEG; never substitutes letters or SVG.
 */
export interface BrandMarkProps {
  /** Pinned sizes: 72 (cover) · 44 (inner pill) · 40 (inside a card). Never below 40. */
  size?: number;
  /** Path to the JPEG. Pass a relative path that resolves from the CONSUMING file — no hard default (would break cross-directory renders). */
  image?: string;
  alt?: string;
  style?: React.CSSProperties;
}
export declare function BrandMark(props: BrandMarkProps): JSX.Element;

/**
 * Disc + @vourdev wordmark on one row. Used on cover + outro.
 */
export interface BrandHeaderProps {
  size?: number;
  image?: string;
  style?: React.CSSProperties;
}
export declare function BrandHeader(props: BrandHeaderProps): JSX.Element;
