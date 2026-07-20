import { describe, it, expect } from "vitest";
import {
  briefSystem,
  briefUserPrompt,
  planSystem,
  planUserPrompt,
  reviseUserPrompt,
} from "@/lib/ai/prompts";

describe("prompt builders", () => {
  it("brief system encodes the canonical brief + copy caps", () => {
    expect(briefSystem).toMatch(/eyebrow/i);
    expect(briefSystem).toMatch(/cover|outro/i);
  });
  it("brief user prompt embeds the idea", () => {
    expect(briefUserPrompt("idempotency di API")).toContain("idempotency di API");
  });
  it("plan system lists the supported roles", () => {
    expect(planSystem).toMatch(/cover/);
    expect(planSystem).toMatch(/point/);
    expect(planSystem).toMatch(/outro/);
  });
  it("plan user prompt embeds the brief", () => {
    expect(planUserPrompt("# Brief\ncontent")).toContain("# Brief");
  });
  it("revise prompt embeds both the current plan and the instruction", () => {
    const p = reviseUserPrompt('{"slides":[]}', "shorten slide 3");
    expect(p).toContain('{"slides":[]}');
    expect(p).toContain("shorten slide 3");
  });
  it("briefSystem and planSystem enforce #fyp hashtag and informative content", () => {
    expect(briefSystem).toMatch(/#fyp/);
    expect(planSystem).toMatch(/fyp/);
    expect(briefSystem).toMatch(/informative/i);
    expect(planSystem).toMatch(/informative/i);
  });
  it("planSystem documents all 6 mockup types", () => {
    expect(planSystem).toContain('"terminal"');
    expect(planSystem).toContain('"comparison"');
    expect(planSystem).toContain('"steps"');
    expect(planSystem).toContain('"callout"');
    expect(planSystem).toContain('"bigstat"');
    expect(planSystem).toContain('"card"');
  });
  it("briefSystem instructs varied mockup types", () => {
    expect(briefSystem).toMatch(/Terminal/);
    expect(briefSystem).toMatch(/Comparison/);
    expect(briefSystem).toMatch(/Steps/);
    expect(briefSystem).toMatch(/Callout/);
    expect(briefSystem).toMatch(/BigStat/);
    expect(briefSystem).toMatch(/VARY/i);
  });
});
