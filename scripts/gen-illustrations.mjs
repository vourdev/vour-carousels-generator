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

   onLight keeps unDraw's own value ordering — dark ink stays dark — but pulls the
   neutrals onto the Vour ramp so they sit on Mist instead of on plain white.
   onDark INVERTS the neutral ramp: what was darkest becomes lightest. Skin tones
   (#ed9da0, #ffb8b8, #a0616a …) are mid-tone and legible on both, so they are left
   alone on purpose — inverting them turns people green. */
const PALETTES = {
  onLight: {
    accent: "#0F6666", // VOUR_TEAL_DEEP — the only accent that passes AA on Mist
    map: {
      "#090814": "#000000",
      "#2f2e41": "#16292A",
      "#2f2e43": "#16292A",
      "#3f3d56": "#2C4445",
      "#b6b3c5": "#93A9A9",
      "#d6d6e3": "#B7CACA",
      "#ccc": "#B7CACA",
      "#cacaca": "#B7CACA",
      "#cbcbcb": "#B7CACA",
      "#e6e6e6": "#D3E1E1",
      "#e4e4e4": "#D3E1E1",
      "#e5e5e5": "#D3E1E1",
      "#f0f0f0": "#E6EFEF",
      "#f1f1f1": "#E6EFEF",
      "#f2f2f2": "#EDF4F4",
      "#fff": "#FFFFFF",
      "#ffffff": "#FFFFFF",
    },
  },
  onDark: {
    accent: "#4DE1F3", // VOUR_TEAL_BRIGHT — 13.4:1 on logo black
    map: {
      "#090814": "#FFFFFF",
      "#2f2e41": "#D8E6E6",
      "#2f2e43": "#D8E6E6",
      "#3f3d56": "#A9C0C0",
      "#b6b3c5": "#3C5050",
      "#d6d6e3": "#2A3B3B",
      "#ccc": "#2A3B3B",
      "#cacaca": "#2A3B3B",
      "#cbcbcb": "#2A3B3B",
      "#e6e6e6": "#1D2C2C",
      "#e4e4e4": "#1D2C2C",
      "#e5e5e5": "#1D2C2C",
      "#f0f0f0": "#152121",
      "#f1f1f1": "#152121",
      "#f2f2f2": "#152121",
      "#fff": "#0D1414",
      "#ffffff": "#0D1414",
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
