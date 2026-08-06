import { describe, it, expect } from "vitest";
import { scopeCss } from "@/lib/ds/scope-css";

describe("scopeCss", () => {
  it("prefixes a plain selector", () => {
    expect(scopeCss(".grid{gap:8px}", ".cm-3")).toBe(".cm-3 .grid{gap:8px}");
  });

  it("prefixes every selector in a comma list", () => {
    const out = scopeCss(".a, .b > span { color: red }", ".cm-0");
    expect(out).toContain(".cm-0 .a");
    expect(out).toContain(".cm-0 .b > span");
  });

  it("does not split commas nested inside :is()/:not()", () => {
    const out = scopeCss(":is(.a, .b) span{color:red}", ".cm-1");
    expect(out).toBe(".cm-1 :is(.a, .b) span{color:red}");
  });

  it("resolves & and :scope to the fragment root itself", () => {
    expect(scopeCss("&{display:flex}", ".cm-2")).toBe(".cm-2{display:flex}");
    expect(scopeCss(":scope > div{gap:4px}", ".cm-2")).toBe(".cm-2 > div{gap:4px}");
  });

  it("recurses into @media", () => {
    const out = scopeCss("@media (min-width:100px){.x{color:red}}", ".cm-4");
    expect(out).toContain("@media (min-width:100px)");
    expect(out).toContain(".cm-4 .x{color:red}");
  });

  it("leaves @keyframes and @font-face bodies untouched", () => {
    const out = scopeCss("@keyframes spin{from{transform:rotate(0)}to{transform:rotate(1turn)}}", ".cm-5");
    expect(out).toContain("@keyframes spin");
    expect(out).not.toContain(".cm-5 from");
    expect(out).not.toContain(".cm-5 to");
  });

  it("drops @import (no network at export time)", () => {
    const out = scopeCss('@import url("evil.css");.x{color:red}', ".cm-6");
    expect(out).not.toContain("@import");
    expect(out).toContain(".cm-6 .x{color:red}");
  });

  it("neutralises rules that target shared slide chrome", () => {
    // A bare `section`/`.geser` rule becomes a descendant selector that matches
    // nothing inside the fragment — the slide chrome stays unreachable.
    const out = scopeCss("section{padding:0}.geser{left:400px}", ".cm-7");
    expect(out).toContain(".cm-7 section{padding:0}");
    expect(out).toContain(".cm-7 .geser{left:400px}");
    expect(out).not.toMatch(/(^|\n)section\{/);
    expect(out).not.toMatch(/(^|\n)\.geser\{/);
  });

  it("strips comments so a brace inside one cannot break parsing", () => {
    const out = scopeCss("/* } tricky */ .x{color:red}", ".cm-8");
    expect(out).toBe(".cm-8 .x{color:red}");
  });

  it("returns empty output for empty input", () => {
    expect(scopeCss("", ".cm-9")).toBe("");
  });
});
