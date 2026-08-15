import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { carouselCss } from "@/lib/ds/carousel-css";
import { carouselExtraCss } from "@/lib/ds/carousel-css-extra";
import {
  VOUR_BLACK,
  VOUR_CHARCOAL,
  VOUR_MIST,
  VOUR_TEAL,
  VOUR_TEAL_BRIGHT,
  VOUR_TEAL_DEEP,
  VOUR_WHITE,
  VOUR_TONES,
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

describe("no warm colour survives anywhere", () => {
  // Warm = red/orange/yellow. Hue 0-100 and 320-360 with any real saturation.
  const isWarm = (hex: string) => {
    const h = hue(hex);
    if (h < 0) return false; // grey
    const c = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (sat < 12) return false; // near-neutral, hue is noise
    return h < 100 || h > 320;
  };

  const expand = (hex: string) =>
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;

  it("has no warm hex in the assembled carousel CSS", () => {
    const hexes = [...new Set(CSS.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? [])].map(expand);
    expect(hexes.filter(isWarm)).toEqual([]);
  });

  it("has no warm rgb() triple in the assembled carousel CSS", () => {
    const warm: string[] = [];
    for (const m of CSS.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
      const [r, g, b] = [m[1], m[2], m[3]].map(Number);
      const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
      if (isWarm(hex)) warm.push(m[0]);
    }
    expect(warm).toEqual([]);
  });

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
