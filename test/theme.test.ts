import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { THEME_PRESET_OPTIONS } from "@/lib/preferences/theme";

const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
// Read as text: both modules pull in next/font, which only runs inside Next.
const prefs = readFileSync(resolve(__dirname, "../lib/preferences/preferences-config.ts"), "utf8");
const fonts = readFileSync(resolve(__dirname, "../lib/fonts/registry.ts"), "utf8");

/**
 * The dashboard UI follows the shadcn admin template (Studio Admin, radix-nova): semantic
 * tokens on :root and .dark, colour presets switched by data-theme-preset, and the theme
 * chosen by the preferences store rather than by the OS.
 */
describe("app UI theme tokens (shadcn admin template)", () => {
  it("defines the semantic tokens for light and dark", () => {
    expect(css).toMatch(/:root\s*{[^}]*--background:/);
    expect(css).toMatch(/\.dark\s*{[^}]*--background:/);
    expect(css).toContain("--sidebar:");
    expect(css).toContain("--chart-1:");
  });

  it("imports a stylesheet for every non-default preset", () => {
    for (const p of THEME_PRESET_OPTIONS) {
      if (p.value === "default") continue;
      expect(css).toContain(`@import "../styles/presets/${p.value}.css"`);
    }
  });

  it("maps the older token names onto the theme instead of fixed hex", () => {
    // These names are still used by the Create studio; as hex they ignored dark mode.
    expect(css).toContain("--color-hairline: var(--border)");
    expect(css).toContain("--color-canvas-soft: var(--muted)");
    expect(css).not.toMatch(/--color-hairline:\s*#/);
  });

  it("does not leak the Vour Dev carousel palette into the app UI", () => {
    expect(css).not.toContain("--ed-paper");
    expect(css).not.toContain("#E94B19");
  });
});

describe("theme preferences", () => {
  it("starts dark, with the toggle for daylight", () => {
    expect(prefs).toMatch(/theme_mode: definePreference\(\{[^}]*defaultValue: "dark"/);
  });

  it("only offers fonts the CSS maps", () => {
    const keys = [...fonts.matchAll(/^\s{2}(\w+): \{ label:/gm)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(0);
    for (const font of keys) {
      expect(css).toContain(`html[data-font="${font}"] body`);
    }
  });
});

/**
 * The user's own chat bubble is bg-primary, so the default selection colour vanished on it
 * and you could not tell whether a word was selected. Only that bubble is inverted.
 */
describe("selection on the user's chat bubble", () => {
  it("inverts the bubble's own pair, so it survives a theme flip", () => {
    expect(css).toMatch(/\.chat-bubble-user[^{]*::selection\s*{[^}]*background:\s*var\(--primary-foreground\)/);
    expect(css).toMatch(/\.chat-bubble-user[^{]*::selection\s*{[^}]*color:\s*var\(--primary\)/);
  });

  it("covers the text nodes inside it, not only the element itself", () => {
    expect(css).toContain(".chat-bubble-user ::selection");
  });
});
