import { describe, it, expect } from "vitest";
import { generatedTopicListSchema, generatedTopicSchema } from "@/lib/topics/schema";

const valid = {
  title: "JWT Itu Bukan Enkripsi",
  category: "common-mistakes",
  description: "Encoding vs encryption di JWT payload.",
  keywords: ["jwt", "security"],
  angle: "fokus: Kesalahan Umum",
  priority: 8,
};

describe("generatedTopicSchema", () => {
  it("accepts a valid topic", () => {
    expect(generatedTopicSchema.parse(valid).category).toBe("common-mistakes");
  });

  it("coerces a hallucinated category to tutorial instead of failing the batch", () => {
    const t = generatedTopicSchema.parse({ ...valid, category: "blockchain-magic" });
    expect(t.category).toBe("tutorial");
  });

  it("normalizes category casing/whitespace", () => {
    const t = generatedTopicSchema.parse({ ...valid, category: "  NextJS ".replace("NextJS", "Nextjs") });
    expect(t.category).toBe("nextjs");
  });

  it("clamps an out-of-range priority to the fallback", () => {
    expect(generatedTopicSchema.parse({ ...valid, priority: 99 }).priority).toBe(5);
  });

  it("rejects an empty keywords array", () => {
    expect(() => generatedTopicSchema.parse({ ...valid, keywords: [] })).toThrow();
  });
});

describe("generatedTopicListSchema", () => {
  it("rejects an empty batch", () => {
    expect(() => generatedTopicListSchema.parse({ topics: [] })).toThrow();
  });
});
