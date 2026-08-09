import { describe, it, expect } from "vitest";
import {
  briefSystem,
  briefUserPrompt,
  planSystem,
  planUserPrompt,
  reviseSystem,
  reviseUserPrompt,
  humanVoiceEditorSystem,
  humanVoiceEditorUserPrompt,
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
  it("enforces exactly 5 hashtags with fyp first and vourdev last (TikTok cap)", () => {
    for (const sys of [briefSystem, planSystem, reviseSystem]) {
      expect(sys).toMatch(/EXACTLY 5/);
      expect(sys).toMatch(/TikTok accepts at most 5/);
      expect(sys).toMatch(/"fyp" first/);
      expect(sys).toMatch(/"vourdev" last/);
    }
    expect(briefSystem).toContain("#fyp #<topic1> #<topic2> #<topic3> #vourdev");
  });
  it("briefSystem and planSystem enforce #fyp hashtag and informative content", () => {
    expect(briefSystem).toMatch(/#fyp/);
    expect(planSystem).toMatch(/fyp/);
    expect(briefSystem).toMatch(/informative/i);
    expect(planSystem).toMatch(/informative/i);
  });
  it("planSystem documents all 10 mockup types", () => {
    expect(planSystem).toContain('"terminal"');
    expect(planSystem).toContain('"comparison"');
    expect(planSystem).toContain('"steps"');
    expect(planSystem).toContain('"callout"');
    expect(planSystem).toContain('"bigstat"');
    expect(planSystem).toContain('"card"');
    expect(planSystem).toContain('"flow"');
    expect(planSystem).toContain('"hub"');
    expect(planSystem).toContain('"concept"');
    expect(planSystem).toContain('"checklist"');
  });
  it("briefSystem instructs varied mockup types", () => {
    expect(briefSystem).toMatch(/Terminal/);
    expect(briefSystem).toMatch(/Comparison/);
    expect(briefSystem).toMatch(/Steps/);
    expect(briefSystem).toMatch(/Callout/);
    expect(briefSystem).toMatch(/BigStat/);
    expect(briefSystem).toMatch(/VARY/i);
  });
  it("reviseSystem includes instructions for slide targeting and outro editing", () => {
    expect(reviseSystem).toMatch(/outro/i);
    expect(reviseSystem).toMatch(/cover/i);
    expect(reviseSystem).toMatch(/ACCENT WORD/i);
    expect(reviseSystem).toMatch(/IDENTIFY TARGET SLIDE/i);
  });
});

describe("planSystem", () => {
  it("documents the cover device hook", () => {
    expect(planSystem).toMatch(/hook/);
    expect(planSystem).toMatch(/device/);
    expect(planSystem).toMatch(/chrome/);
  });
  it("requires an outro cta", () => {
    expect(planSystem).toMatch(/cta/);
    expect(planSystem.toLowerCase()).toMatch(/call.?to.?action|cta/);
  });
  it("enforces the icon allowlist with a sparkles fallback", () => {
    expect(planSystem).toContain("ICON RULES");
    expect(planSystem).toContain("sparkles");
    expect(planSystem).not.toContain("<lucide:slug>");
  });
  it("makes the cover hook optional (text-only intro allowed)", () => {
    expect(planSystem).toMatch(/hook is OPTIONAL/);
    expect(planSystem).toMatch(/text-only cover/i);
  });
  it("makes mockup choice context-driven and caps terminal at once per deck", () => {
    expect(planSystem).toMatch(/CONTEXT-DRIVEN MOCKUP CHOICE/);
    expect(planSystem).toMatch(/code\/UI is the point/i);
    expect(planSystem).toMatch(/MAX 1 per 5 slides|AT MOST ONCE per deck/i);
  });
});

describe("briefSystem intro examples", () => {
  it("includes a text-only cover example", () => {
    expect(briefSystem).toContain("istilah AI yang wajib lo");
  });
});

describe("reviseSystem", () => {
  it("covers editing the hook and the cta", () => {
    expect(reviseSystem).toMatch(/hook/);
    expect(reviseSystem).toMatch(/cta/);
  });
});

describe("humanVoiceEditorSystem", () => {
  it("encodes anti-agentic rules and voice signature", () => {
    expect(humanVoiceEditorSystem).toContain("PEMBUKA GENERIK");
    expect(humanVoiceEditorSystem).toContain("HEDGING BERLEBIHAN");
    expect(humanVoiceEditorSystem).toContain("TRANSISI FORMULAIK");
    expect(humanVoiceEditorSystem).toContain("PENJELASAN BERLEBIHAN");
    expect(humanVoiceEditorSystem).toContain("RANGKUMAN PENUTUP KLISE");
    expect(humanVoiceEditorSystem).toContain("KESEIMBANGAN PALSU");
    expect(humanVoiceEditorSystem).toContain("@vourdev");
  });

  it("builds user prompt with brief payload", () => {
    const prompt = humanVoiceEditorUserPrompt("# Draft Brief");
    expect(prompt).toContain("# Draft Brief");
    expect(prompt).toContain("Perform the Human Voice Editor pass now");
  });
});
