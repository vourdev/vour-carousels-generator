import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");

describe("app UI theme tokens (vercel-DESIGN.md)", () => {
  it("defines the Vercel-inspired palette in @theme", () => {
    expect(css).toContain("--color-canvas: #ffffff");
    expect(css).toContain("--color-ink: #171717");
    expect(css).toContain("--color-primary: #171717");
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
