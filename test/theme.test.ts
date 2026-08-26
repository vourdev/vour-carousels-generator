import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");

describe("app UI theme tokens (vercel-DESIGN.md)", () => {
  it("defines the Vercel-inspired palette in @theme", () => {
    expect(css).toContain("--color-canvas: #ffffff");
    expect(css).toContain("--color-ink: #171717");
    expect(css).toContain("--primary: #171717");
  });
  it("defines the brand mesh-gradient stops", () => {
    expect(css).toContain("--color-grad-develop-start: #007cf0");
    expect(css).toContain("--color-grad-preview-end: #ff0080");
  });
  it("defines Geist sans + mono font families", () => {
    expect(css).toContain("--font-sans");
    expect(css).toContain("--font-mono");
    expect(css).toContain("Geist");
  });
  it("does not leak the Vour Dev carousel palette into the app UI", () => {
    expect(css).not.toContain("--ed-paper");
    expect(css).not.toContain("#E94B19");
  });
});

/**
 * The global ::selection paints ink-on-light, which is correct everywhere except on the
 * one surface that is already ink: the user's own chat bubble. There, selecting text
 * painted dark on dark and the highlight was invisible — you could not tell whether a
 * word was selected. Only that bubble is inverted.
 */
describe("selection on the user's chat bubble", () => {
  it("inverts the bubble's own pair, so it survives a theme flip", () => {
    // Not a hardcoded white: .dark flips --primary without flipping --color-canvas, so a
    // fixed light highlight would go invisible the moment the bubble turns light.
    expect(css).toMatch(/\.chat-bubble-user[^{]*::selection\s*{[^}]*background:\s*var\(--primary-foreground\)/);
    expect(css).toMatch(/\.chat-bubble-user[^{]*::selection\s*{[^}]*color:\s*var\(--primary\)/);
  });

  it("covers the text nodes inside it, not only the element itself", () => {
    expect(css).toContain(".chat-bubble-user ::selection");
  });

  it("leaves the global selection rule alone", () => {
    expect(css).toMatch(/^\s{2}::selection\s*{/m);
  });
});
