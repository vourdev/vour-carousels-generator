import { describe, it, expect } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { generateBrief, generateSlidePlan } from "@/lib/ai/generate";

const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };

const textModel = new MockLanguageModelV4({
  doGenerate: async () => ({
    finishReason: "stop",
    usage,
    content: [{ type: "text", text: "# Carousel Content — Test" }],
    warnings: [],
  }),
});

const planObject = {
  title: "T",
  caption: "c",
  hashtags: ["a"],
  slides: [{ role: "cover", eyebrow: "E", headline: "H", accentWord: "H" }],
};

const objectModel = new MockLanguageModelV4({
  doGenerate: async () => ({
    finishReason: "stop",
    usage,
    content: [{ type: "text", text: JSON.stringify(planObject) }],
    warnings: [],
  }),
});

describe("generateBrief", () => {
  it("returns the model text", async () => {
    expect(await generateBrief("idea", textModel)).toContain("# Carousel Content");
  });
});

describe("generateSlidePlan", () => {
  it("returns a schema-valid slide plan", async () => {
    const plan = await generateSlidePlan("# brief", objectModel);
    expect(plan.slides[0].role).toBe("cover");
    expect(plan.title).toBe("T");
  });
});
