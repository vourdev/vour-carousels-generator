import * as React from "react";
/**
 * Editorial info card. Opaque pastel background. Optional mono label, icon, title, body.
 *
 * @startingPoint section="Slide pieces" subtitle="Editorial info card" viewport="640x320"
 */
export interface InfoCardProps {
  /** Card background tone (from the --ed-card-* family). */
  tone?: "peach" | "stone" | "mint" | "sky" | "pink" | "amber";
  /** Iconify name for the 24×24 line icon inside the 48×48 icon container. */
  icon?: string;
  /** Title — Sora 700 · --fs-h3 (40px). */
  title?: React.ReactNode;
  /** Body — Nunito 500 · --fs-body (28px). Max 3 lines. */
  body?: React.ReactNode;
  /** Optional ALL-CAPS mono label at the top (e.g. "SCRAPED"). */
  label?: string;
  /** Override label color (default: accent for the tone). */
  labelTone?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function InfoCard(props: InfoCardProps): JSX.Element;
