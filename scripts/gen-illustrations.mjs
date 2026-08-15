// One-off/codegen: download the curated unDraw allowlist into individual SVG files under
// lib/ds/assets/illustrations/, in two surface variants, plus a tiny TS file holding just
// the slug union.
//
// Two variants, not one. Deck slides render on two surfaces — Ink (near-black, the
// default) and Paper (cream) — and unDraw ships a fixed palette built for white pages:
// #090814 / #2f2e41 / #3f3d56 for hair, clothes and outlines. On Ink those are almost
// the background colour, so the illustration dissolves. carousel-css-extra.ts already
// states the rule ("a mockup must never name a literal ink/paper colour"), but an SVG
// fill cannot be re-scoped by CSS the way a token can — so the remap happens here, at
// codegen, and the renderer just picks the file matching the slide's surface.
//
// The SVGs are deliberately NOT emitted as a TS module: importing inline SVG string
// literals made every bundler that touched the render path drag the whole payload along,
// and it ended up in the browser bundle. As plain files they are read at request time by
// lib/ds/illustrations.server.ts (fs.readFileSync) and never reach the client.
import { writeFileSync, readFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const manifestUrl = new URL("../lib/ds/illustrations.manifest.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf-8"));

// Flatten all slugs across categories
const SLUGS = Array.from(
  new Set(Object.values(manifest).flat())
);

// unDraw's own accent, replaced by the brand accent for the surface being built.
const UNDRAW_ACCENTS = [/#6c63ff/gi, /#6c5ce7/gi];

/* ── Surface palettes ──────────────────────────────────────────────────────────
   Keys are the colours unDraw actually ships, measured across all 145 files:
   #fff (75%), #e6e6e6 (64%), #3f3d56 (62%), #090814 (60%), #f2f2f2 (52%),
   #2f2e41 (44%), #ccc (37%), #d6d6e3 (28%) …

   onLight keeps unDraw's own value ordering — dark ink stays dark — but warms the
   neutrals into the brand ramp so they sit on cream instead of on white.
   onDark INVERTS the neutral ramp: what was darkest becomes lightest. Skin tones
   (#ed9da0, #ffb8b8, #a0616a …) are mid-tone and legible on both, so they are left
   alone on purpose — inverting them turns people green. */
const PALETTES = {
  onLight: {
    accent: "#EE4B1A", // --ms-accent on Paper
    map: {
      "#090814": "#1C0A05",
      "#2f2e41": "#33211A",
      "#2f2e43": "#33211A",
      "#3f3d56": "#4A342A",
      "#b6b3c5": "#B3A493",
      "#d6d6e3": "#CFC2B0",
      "#ccc": "#CFC2B0",
      "#cacaca": "#CFC2B0",
      "#cbcbcb": "#CFC2B0",
      "#e6e6e6": "#DED3C4",
      "#e4e4e4": "#DED3C4",
      "#e5e5e5": "#DED3C4",
      "#f0f0f0": "#F0E7DA",
      "#f1f1f1": "#F0E7DA",
      "#f2f2f2": "#F5EDE2",
      "#fff": "#FFFDF9",
      "#ffffff": "#FFFDF9",
    },
  },
  onDark: {
    accent: "#FF6A3D", // --ms-accent on Ink
    map: {
      "#090814": "#F7F1E8",
      "#2f2e41": "#E0D8CC",
      "#2f2e43": "#E0D8CC",
      "#3f3d56": "#C4B9AA",
      "#b6b3c5": "#4A4038",
      "#d6d6e3": "#3A322A",
      "#ccc": "#3A322A",
      "#cacaca": "#3A322A",
      "#cbcbcb": "#3A322A",
      "#e6e6e6": "#2E2721",
      "#e4e4e4": "#2E2721",
      "#e5e5e5": "#2E2721",
      "#f0f0f0": "#241E18",
      "#f1f1f1": "#241E18",
      "#f2f2f2": "#241E18",
      "#fff": "#1F1A15",
      "#ffffff": "#1F1A15",
    },
  },
};

const assetsDir = fileURLToPath(new URL("../lib/ds/assets/illustrations/", import.meta.url));

/**
 * Recolor one raw unDraw SVG for a surface.
 *
 * Every hex is rewritten in a single pass against a lookup table. A sequence of
 * independent .replace() calls would let an earlier substitution be re-matched by a
 * later rule — with the inverting onDark map, #fff -> #1F1A15 followed by a dark rule
 * would flip it straight back.
 */
function recolor(raw, palette) {
  let svg = raw;
  for (const rx of UNDRAW_ACCENTS) svg = svg.replace(rx, palette.accent);
  return svg.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, (hex) => {
    const key = hex.toLowerCase();
    return palette.map[key] ?? hex;
  });
}

async function fetchSvgWithRetry(slug, maxRetries = 3) {
  const urls = [
    `https://cdn.undraw.co/illustrations/${slug}.svg`,
    `https://cdn.undraw.co/illustration/${slug}.svg`,
  ];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.status === 200) {
          const svg = await res.text();
          // Strip the XML declaration — these are inlined into an HTML document.
          if (svg.includes("<svg")) return svg.replace(/^<\?xml[^>]*\?>\s*/i, "").trim();
        }
      } catch (err) {
        // Continue to next URL / attempt
      }
    }
    // Backoff delay before retry
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
  return null;
}

// Wipe the folder first so a slug removed from the manifest also disappears from disk —
// otherwise stale SVGs linger and renderIllustration() would still happily serve them.
rmSync(assetsDir, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });

const ok = [];
console.log(`Fetching ${SLUGS.length} unDraw illustrations (2 surface variants each)...`);

for (const slug of SLUGS) {
  const raw = await fetchSvgWithRetry(slug);
  if (!raw) {
    console.warn(`⚠️ Warning: Failed to fetch illustration "${slug}" after retries, skipping.`);
    continue;
  }
  for (const [variant, palette] of Object.entries(PALETTES)) {
    writeFileSync(`${assetsDir}${slug}.${variant}.svg`, recolor(raw, palette));
  }
  ok.push(slug);
}

const slugsLiteral = ok.map((s) => `  "${s}",`).join("\n");

const ts = `// AUTO-GENERATED by scripts/gen-illustrations.mjs — do not edit by hand.
// Slug union only. Each slug has two SVG files in lib/ds/assets/illustrations/ —
// <slug>.onLight.svg and <slug>.onDark.svg — read server-side by
// lib/ds/illustrations.server.ts. Keep the bodies out of any module graph a client
// component can reach.
export const ILLUSTRATION_SLUGS = [
${slugsLiteral}
] as const;

/** Surface variants generated per slug. The renderer picks one from slide.surface. */
export const ILLUSTRATION_VARIANTS = ["onLight", "onDark"] as const;
`;

const outUrl = new URL("../lib/ds/illustrations.slugs.generated.ts", import.meta.url);
writeFileSync(outUrl, ts);

const files = readdirSync(assetsDir);
const bytes = files.reduce((n, f) => n + readFileSync(`${assetsDir}${f}`).length, 0);
console.log(
  `✅ wrote ${files.length} SVGs (${ok.length} slugs × 2 variants) to lib/ds/assets/illustrations/ (${(bytes / 1024 / 1024).toFixed(2)} MB)`
);
console.log(`✅ wrote lib/ds/illustrations.slugs.generated.ts (${ok.length} slugs)`);
