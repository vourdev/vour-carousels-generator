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
});
