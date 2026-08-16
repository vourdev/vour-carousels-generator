import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { carouselCss } from "@/lib/ds/carousel-css";
import { carouselExtraCss } from "@/lib/ds/carousel-css-extra";
import { stripEmoji } from "@/lib/ds/strip-emoji";
import { renderSlide } from "@/lib/ds/render-slide";
import {
  VOUR_BLACK,
  VOUR_CHARCOAL,
  VOUR_MIST,
  VOUR_TEAL,
  VOUR_TEAL_BRIGHT,
  VOUR_TEAL_DEEP,
  VOUR_TEAL_TEXT,
  VOUR_WHITE,
  VOUR_TONES,
  VOUR_POSITIVE_ON_DARK,
  VOUR_AMBER,
  VOUR_AMBER_DEEP,
  VOUR_AMBER_WASH,
  VOUR_PAPER,
} from "@/lib/ds/tokens";

const CSS = carouselCss + carouselExtraCss;

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const parts = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = parts.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Hue in degrees, 0-360. Used to prove nothing warm survived. */
function hue(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return -1; // achromatic
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

describe("Vour palette contrast", () => {
  it("uses an accent on light surfaces that passes AA on BOTH of them", () => {
    // The chosen value is the reason VOUR_TEAL_DEEP is not the logo teal: #50DCDC is
    // 1.7:1 on white. This is the check that picked #0F6666 over #157F7F.
    expect(contrast(VOUR_TEAL_DEEP, VOUR_WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(VOUR_TEAL_DEEP, VOUR_MIST)).toBeGreaterThanOrEqual(4.5);
  });

  it("rejects the lighter teals that were considered for light surfaces", () => {
    // Guards the decision, not the code: if someone "corrects" VOUR_TEAL_DEEP back
    // toward the logo teal, the first assertion above fails and this says why.
    expect(contrast("#157F7F", VOUR_MIST)).toBeLessThan(4.5);
    expect(contrast("#1A9999", VOUR_MIST)).toBeLessThan(4.5);
  });

  it("keeps the logo teals well clear of both dark surfaces", () => {
    for (const teal of [VOUR_TEAL, VOUR_TEAL_BRIGHT]) {
      expect(contrast(teal, VOUR_BLACK)).toBeGreaterThanOrEqual(7);
      expect(contrast(teal, VOUR_CHARCOAL)).toBeGreaterThanOrEqual(7);
    }
  });

  it("keeps body text at AAA on every surface it is used on", () => {
    expect(contrast(VOUR_BLACK, VOUR_MIST)).toBeGreaterThanOrEqual(7);
    expect(contrast(VOUR_BLACK, VOUR_WHITE)).toBeGreaterThanOrEqual(7);
    expect(contrast(VOUR_WHITE, VOUR_BLACK)).toBeGreaterThanOrEqual(7);
    expect(contrast(VOUR_WHITE, VOUR_CHARCOAL)).toBeGreaterThanOrEqual(7);
  });

  it("keeps every tone's ink readable on its own background", () => {
    for (const [name, tone] of Object.entries(VOUR_TONES)) {
      expect(contrast(tone.ink, tone.bg), name).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("exactly one warm accent exists, and only in its own values", () => {
  /**
   * The deck was all-cool after the rebrand and read as newsprint. Amber was added to
   * give it magazine colour — but "one accent" is only a real constraint if something
   * checks it. This is that check: any warm value in the CSS that is not one of the
   * three amber tokens is a second accent sneaking in.
   */
  const AMBER_ALLOWED = new Set(
    // The three accent values, plus the cream SURFACE. Cream is warm by construction
    // and is not an accent — it is the second sheet of paper, listed here so the guard
    // stays a whitelist of exactly what was decided rather than a hue rule with holes.
    [VOUR_AMBER, VOUR_AMBER_DEEP, VOUR_AMBER_WASH, VOUR_PAPER].map((h) => h.toLowerCase())
  );
  const AMBER_RGB = new Set(["232,163,61", "148,100,10", "247,233,207"]);

  const expand = (hex: string) =>
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const isWarm = (hex: string) => {
    const h = hue(hex);
    if (h < 0) return false;
    const c = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
    if (Math.max(r, g, b) - Math.min(r, g, b) < 12) return false;
    return h < 100 || h > 320;
  };

  it("allows no warm hex in the carousel CSS other than the amber tokens", () => {
    const hexes = [...new Set(CSS.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? [])].map(expand);
    const strays = hexes.filter((h) => isWarm(h) && !AMBER_ALLOWED.has(h.toLowerCase()));
    expect(strays).toEqual([]);
  });

  it("allows no warm rgb() triple other than the amber tokens", () => {
    const strays: string[] = [];
    for (const m of CSS.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
      const [r, g, b] = [m[1], m[2], m[3]].map(Number);
      const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
      if (isWarm(hex) && !AMBER_RGB.has(`${r},${g},${b}`)) strays.push(m[0]);
    }
    expect(strays).toEqual([]);
  });

  it("keeps amber out of the headline accent word on both surfaces", () => {
    // The primary accent stays teal. A brand with two primary accents has none.
    const accentRules = CSS.split("\n").filter((l) => /h1 \.a\b/.test(l));
    expect(accentRules.length).toBeGreaterThan(0);
    for (const rule of accentRules) {
      expect(rule.toLowerCase()).not.toContain(VOUR_AMBER.toLowerCase());
      expect(rule.toLowerCase()).not.toContain(VOUR_AMBER_DEEP.toLowerCase());
    }
  });

  it("pins each amber value to the surface where it is legible", () => {
    // #E8A33D is 1.99:1 on Mist — unusable on light even as a fill. #94640A is 4.09:1
    // on black — the dull one on dark. Neither may be used on the wrong surface.
    expect(contrast(VOUR_AMBER, VOUR_MIST)).toBeLessThan(3);
    expect(contrast(VOUR_AMBER_DEEP, VOUR_MIST)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(VOUR_AMBER_DEEP, VOUR_PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(VOUR_AMBER, VOUR_BLACK)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(VOUR_AMBER, VOUR_CHARCOAL)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps text on every solid accent block readable", () => {
    // A filled badge is only an upgrade if the numeral inside it survives.
    expect(contrast(VOUR_WHITE, VOUR_TEAL_DEEP)).toBeGreaterThanOrEqual(4.5); // light surface
    expect(contrast(VOUR_BLACK, VOUR_TEAL)).toBeGreaterThanOrEqual(4.5); // dark surface
    expect(contrast(VOUR_WHITE, VOUR_AMBER_DEEP)).toBeGreaterThanOrEqual(4.5); // light badge
    expect(contrast(VOUR_BLACK, VOUR_AMBER)).toBeGreaterThanOrEqual(4.5); // dark badge
    // White on the bright values is the mistake this guards against.
    expect(contrast(VOUR_WHITE, VOUR_AMBER)).toBeLessThan(4.5);
    expect(contrast(VOUR_WHITE, VOUR_TEAL)).toBeLessThan(4.5);
  });

  it("keeps the second light surface from weakening any contrast", () => {
    // Cream is deliberately a shade LIGHTER than Mist, so Mist stays the binding
    // surface and nothing already checked against it needs rechecking here.
    expect(luminance(VOUR_PAPER)).toBeGreaterThanOrEqual(luminance(VOUR_MIST));
    expect(contrast(VOUR_BLACK, VOUR_PAPER)).toBeGreaterThanOrEqual(7);
    expect(contrast("#223131", VOUR_PAPER)).toBeGreaterThanOrEqual(7);
    expect(contrast(VOUR_TEAL_DEEP, VOUR_PAPER)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("illustrations carry no stale accent", () => {
  it("has no warm accent left in any generated illustration", () => {
    // The generator rewrites unDraw's #6c63ff to the surface accent. A stale asset
    // directory would still carry the old Ember accent, and nothing else would notice.
    const dir = join(process.cwd(), "lib", "ds", "assets", "illustrations");
    const files = readdirSync(dir).filter((f) => f.endsWith(".svg"));
    expect(files.length).toBe(290);

    const offenders: string[] = [];
    for (const f of files) {
      const svg = readFileSync(join(dir, f), "utf8");
      if (/#EE4B1A|#FF6A3D|#6c63ff/i.test(svg)) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it("recolours each illustration variant to its own surface accent", () => {
    const dir = join(process.cwd(), "lib", "ds", "assets", "illustrations");
    const light = readFileSync(join(dir, "server-error_syuz.onLight.svg"), "utf8");
    const dark = readFileSync(join(dir, "server-error_syuz.onDark.svg"), "utf8");
    expect(light).toContain(VOUR_TEAL_DEEP);
    expect(dark).toContain(VOUR_TEAL_BRIGHT);
  });
});

describe("background variety is preserved", () => {
  it("still ships two distinct slide surfaces", () => {
    expect(CSS).toMatch(/body section:not\(\.paper\)\s*\{[\s\S]*?background:/);
    expect(carouselCss).toMatch(/section\s*\{[\s\S]*?background:/);
  });

  it("gives the dark surface depth rather than one flat black", () => {
    expect(CSS).toContain(`radial-gradient(130% 90% at 50% 0%, ${VOUR_CHARCOAL}, ${VOUR_BLACK} 68%)`);
  });

  it("holds the dark surface glows inside the 5-10% the brief asked for", () => {
    // Only the background washes: a teal box-shadow on a teal chip is a different
    // thing and is allowed to be opaque.
    const glows = [...CSS.matchAll(/radial-gradient\([^)]*rgba\(\s*(?:80,\s*220,\s*220|77,\s*225,\s*243)\s*,\s*([\d.]+)\s*\)/g)].map(
      (m) => Number(m[1])
    );
    expect(glows.length).toBeGreaterThan(0);
    for (const a of glows) expect(a).toBeLessThanOrEqual(0.1);
  });

  it("textures the light surface instead of leaving it flat", () => {
    expect(carouselCss).toContain("32px 32px");
  });

  it("keeps all six card tones distinct", () => {
    const backgrounds = Object.values(VOUR_TONES).map((t) => t.bg);
    expect(new Set(backgrounds).size).toBe(6);
  });
});

describe("emoji cannot smuggle colour onto a slide", () => {
  it("strips pictographic emoji from copy", () => {
    expect(stripEmoji("❌ Jangan index semua kolom")).toBe("Jangan index semua kolom");
    expect(stripEmoji("⚡ OVERLAP 💥 CORRUPT")).toBe("OVERLAP CORRUPT");
    expect(stripEmoji("selesai ✅")).toBe("selesai");
    expect(stripEmoji("👩‍💻 developer")).toBe("developer");
  });

  it("keeps the typographic marks the mockups rely on", () => {
    // These take their colour from CSS, so they are already themed.
    for (const mark of ["✓", "✗", "→", "─"]) {
      expect(stripEmoji(`a ${mark} b`)).toBe(`a ${mark} b`);
    }
  });

  it("leaves ordinary copy untouched, including Indonesian punctuation", () => {
    const s = "Planner milih jalur termurah — bukan niat kamu (100%).";
    expect(stripEmoji(s)).toBe(s);
  });

  it("removes them from rendered slide HTML, not just from the helper", () => {
    const html = renderSlide({
      role: "point",
      counter: "02 / 08",
      eyebrow: "TEST",
      headline: "Jangan ❌ begitu",
      accentWord: "begitu",
      body: "⚡ Planner milih jalur termurah.",
      mockup: { type: "callout", icon: "zap", text: "💥 Data korup" },
    });
    expect(html).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    expect(html).toContain("Data korup");
  });
});

describe("accent never out-shouts the copy it serves", () => {
  // Measured against the surface each element actually sits on. The failure this
  // guards is not a contrast failure — every value here passes AA either way. It is a
  // HIERARCHY failure: an accent brighter than the body text moves the reader's entry
  // point off the sentence and onto the highlighted word.
  const BODY_ON_DARK = "#AEB2B2"; // --ms-fg-muted, 72% mist over black, resolved
  const HEADLINE_ON_DARK = VOUR_WHITE;

  it("keeps the dark-surface text accent dimmer than the body copy", () => {
    const accent = contrast(VOUR_TEAL_TEXT, VOUR_BLACK);
    const body = contrast(BODY_ON_DARK, VOUR_BLACK);
    expect(accent).toBeLessThan(body);
    // and comfortably under the headline, which is the real primary
    expect(accent).toBeLessThan(contrast(HEADLINE_ON_DARK, VOUR_BLACK));
  });

  it("still clears AA for the accent word at body size", () => {
    expect(contrast(VOUR_TEAL_TEXT, VOUR_BLACK)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(VOUR_TEAL_TEXT, VOUR_CHARCOAL)).toBeGreaterThanOrEqual(4.5);
  });

  it("documents why the logo teal itself cannot be the text accent on dark", () => {
    // If someone restores VOUR_TEAL here, this is the number that says why not.
    expect(contrast(VOUR_TEAL, VOUR_BLACK)).toBeGreaterThan(contrast(BODY_ON_DARK, VOUR_BLACK));
  });

  it("keeps the light-surface ordering headline > body > accent", () => {
    const headline = contrast(VOUR_BLACK, VOUR_MIST);
    const body = contrast("#223131", VOUR_MIST);
    const accent = contrast(VOUR_TEAL_DEEP, VOUR_MIST);
    expect(headline).toBeGreaterThan(body);
    expect(body).toBeGreaterThan(accent);
  });

  it("keeps a cover status glyph brighter than the node that frames it", () => {
    // The NOC grid failed the same way round as the accent word did, one level down:
    // the glyph measured 7.2:1 on the node fill (well past the 3:1 a graphic needs), but
    // the node's own border was heavier and the glyph was drawn at 34px inside a ~124px
    // tile, so the grid read as eighteen empty boxes. Assert the ordering, not just AA.
    const NODE_FILL = "#0F1414"; // rgba(96,114,114,0.16) over the ink cover, resolved
    const NODE_BORDER = "#607272";
    const DOWN_GLYPH = "#B2BEBE"; // VOUR_MIST_MUTED (0.72) over NODE_FILL, resolved

    expect(contrast(DOWN_GLYPH, NODE_FILL)).toBeGreaterThanOrEqual(3);
    expect(contrast(VOUR_POSITIVE_ON_DARK, NODE_FILL)).toBeGreaterThanOrEqual(3);
    // The glyph must out-rank its own frame, or the chrome reads as the content.
    expect(contrast(DOWN_GLYPH, NODE_FILL)).toBeGreaterThan(contrast(NODE_BORDER, NODE_FILL));
    // …and stay under the cover headline, which is still the primary.
    expect(contrast(DOWN_GLYPH, VOUR_BLACK)).toBeLessThan(contrast(VOUR_WHITE, VOUR_BLACK));
  });

  it("documents why the old 'up' state colour could not stay", () => {
    // #16705A is a light-surface positive. On the node fill it was 3.2:1 — technically
    // a pass, visibly a smudge, and dimmer than the border around it.
    const NODE_FILL = "#0F1414";
    expect(contrast("#16705A", NODE_FILL)).toBeLessThan(contrast("#607272", NODE_FILL));
  });

  it("leaves the full-strength logo teal in use for chrome", () => {
    // Dimming the accent must not quietly drain the brand out of the deck.
    expect(CSS).toContain(VOUR_TEAL);
  });
});
