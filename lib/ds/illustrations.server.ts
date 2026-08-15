// Server-only half of the illustration system: reads the inline SVG bodies off disk.
//
// This module must never end up in a client bundle. The `node:fs` import is the guard —
// Next.js fails the build if a client component reaches this file. That is deliberate:
// the SVGs total ~3 MB across both surface variants, and when they were a TS module
// every importer of render-slide dragged them into the browser bundle.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FALLBACK_ILLUSTRATION,
  normalizeIllustration,
  type IllustrationSlug,
} from "@/lib/ds/illustrations";

const ASSETS_DIR = join(process.cwd(), "lib", "ds", "assets", "illustrations");

/** Which recolored variant to serve. Derived from the slide surface, never from the AI. */
export type IllustrationVariant = "onLight" | "onDark";

// One deck renders the same slug across several slides and the file never changes at
// runtime, so cache what has been read. Only slugs actually used pay the disk hit.
const cache = new Map<string, string>();

function read(slug: IllustrationSlug, variant: IllustrationVariant): string | null {
  const key = `${slug}.${variant}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  try {
    const svg = readFileSync(join(ASSETS_DIR, `${key}.svg`), "utf-8");
    cache.set(key, svg);
    return svg;
  } catch {
    return null;
  }
}

/**
 * Inline <svg> string for an illustration slug, recolored for the given surface.
 * Never empty. Server-side only.
 *
 * `variant` is resolved by the renderer from slide.surface — Ink slides get onDark,
 * Paper slides get onLight. The AI has no say in it; it only picks slugs.
 */
export function renderIllustration(raw: string, variant: IllustrationVariant): string {
  const slug = normalizeIllustration(raw);
  // The manifest and the assets folder are regenerated together, so a miss here means
  // someone edited one without the other — fall back rather than render a hole.
  return read(slug, variant) ?? read(FALLBACK_ILLUSTRATION, variant) ?? "";
}
