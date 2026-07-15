import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");

describe("brand theme tokens", () => {
  it("defines the editorial palette from DESIGN.md", () => {
    expect(css).toContain("--ed-paper: #FBF6EF");
    expect(css).toContain("--ed-ink: #1F0904");
    expect(css).toContain("--ed-orange: #E94B19");
  });
  it("defines the brand font families", () => {
    expect(css).toContain("--font-display");
    expect(css).toContain("--font-body");
    expect(css).toContain("--font-mono");
  });
  it("does not keep the generic neutral background", () => {
    expect(css).not.toContain("--background: #ffffff");
  });
});
