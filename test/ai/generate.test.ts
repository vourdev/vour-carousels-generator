import { describe, it, expect } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4GenerateResult } from "@ai-sdk/provider";
import { generateBrief, generateSlidePlan } from "@/lib/ai/generate";

// Minimal generate result for the mock. Cast to the SDK type — the runtime
// only reads content/finishReason/usage; the full nested shape isn't needed.
const result = (text: string) =>
  ({
    finishReason: { unified: "stop" },
    usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
    content: [{ type: "text", text }],
    warnings: [],
  }) as unknown as LanguageModelV4GenerateResult;

const textModel = new MockLanguageModelV4({
  doGenerate: async () => result("# Carousel Content — Test"),
});

const planObject = {
  title: "T",
  caption: "c",
  hashtags: ["a"],
  slides: [{ role: "cover", eyebrow: "E", headline: "H", accentWord: "H" }],
};

const objectModel = new MockLanguageModelV4({
  doGenerate: async () => result(JSON.stringify(planObject)),
});

describe("generateBrief", () => {
  it("returns the model text", async () => {
    expect(await generateBrief("idea", textModel)).toContain("# Carousel Content");
  });

  it("retries 3 times and formats the error", async () => {
    let callCount = 0;
    const failingModel = new MockLanguageModelV4({
      doGenerate: async () => {
        callCount++;
        throw new Error("AI_APICallError: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.");
      },
    });

    await expect(generateBrief("idea", failingModel)).rejects.toThrow(
      "Failed after 3 attempts. Last error: AI_APICallError: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later."
    );
    expect(callCount).toBe(3);
  });
});

describe("generateSlidePlan", () => {
  it("returns a schema-valid slide plan", async () => {
    const plan = await generateSlidePlan("# brief", objectModel);
    expect(plan.slides[0].role).toBe("cover");
    expect(plan.title).toBe("T");
  });
});
