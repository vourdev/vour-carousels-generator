// Server-only half of the illustration system: reads the inline SVG bodies off disk.
//
// This module must never end up in a client bundle. The `node:fs` import is the guard —
// Next.js fails the build if a client component reaches this file. That is deliberate:
// the 145 SVGs total ~1.5 MB, and when they were a TS module every importer of
// render-slide dragged them into the browser bundle.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FALLBACK_ILLUSTRATION,
  normalizeIllustration,
  type IllustrationSlug,
} from "@/lib/ds/illustrations";

const ASSETS_DIR = join(process.cwd(), "lib", "ds", "assets", "illustrations");

// One deck renders the same slug across several slides and the file never changes at
// runtime, so cache what has been read. Only slugs actually used pay the disk hit.
const cache = new Map<IllustrationSlug, string>();

function read(slug: IllustrationSlug): string | null {
  const hit = cache.get(slug);
  if (hit !== undefined) return hit;
  try {
    const svg = readFileSync(join(ASSETS_DIR, `${slug}.svg`), "utf-8");
    cache.set(slug, svg);
    return svg;
  } catch {
    return null;
  }
}

/** Inline <svg> string for an illustration slug. Never empty. Server-side only. */
export function renderIllustration(raw: string): string {
  const slug = normalizeIllustration(raw);
  // The manifest and the assets folder are regenerated together, so a miss here means
  // someone edited one without the other — fall back rather than render a hole.
  return read(slug) ?? read(FALLBACK_ILLUSTRATION) ?? "";
}
