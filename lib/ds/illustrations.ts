import { ILLUSTRATION_SLUGS, ILLUSTRATION_SVGS } from "@/lib/ds/illustrations.generated";
import manifest from "@/lib/ds/illustrations.manifest.json";

export { ILLUSTRATION_SLUGS };
export type IllustrationSlug = (typeof ILLUSTRATION_SLUGS)[number];

export const ILLUSTRATION_CATEGORIES = manifest as Record<string, string[]>;

const FALLBACK: IllustrationSlug = "online-learning_tgmv";
const KNOWN = new Set<string>(ILLUSTRATION_SLUGS);

/** Lowercase, trim, and coerce to a known illustration slug (fallback: online-learning_tgmv). */
export function normalizeIllustration(raw: string): IllustrationSlug {
  const slug = (raw ?? "").trim().toLowerCase();
  return (KNOWN.has(slug) ? slug : FALLBACK) as IllustrationSlug;
}

/** Inline <svg> string for an illustration slug. Never empty. */
export function renderIllustration(raw: string): string {
  const slug = normalizeIllustration(raw);
  return ILLUSTRATION_SVGS[slug] ?? ILLUSTRATION_SVGS[FALLBACK];
}
