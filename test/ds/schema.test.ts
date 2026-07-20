import { describe, it, expect } from "vitest";
import { slidePlanSchema, mockupSchema } from "@/lib/ds/schema";

const valid = {
  title: "Test",
  caption: "cap",
  hashtags: ["a", "b"],
  slides: [
    { role: "cover", eyebrow: "BACKEND", headline: "Idempotency", accentWord: "Idempotency" },
    { role: "point", counter: "02 / 05", eyebrow: "WHY", headline: "It matters", body: "because." },
    { role: "outro", headline: "Follow @vourdev" },
  ],
};

describe("slidePlanSchema", () => {
  it("accepts a valid plan", () => {
    expect(slidePlanSchema.parse(valid).slides).toHaveLength(3);
  });
  it("rejects an unknown role", () => {
    const bad = { ...valid, slides: [{ role: "banana", headline: "x" }] };
    expect(() => slidePlanSchema.parse(bad)).toThrow();
  });
  it("rejects a card tone outside the palette", () => {
    const bad = {
      ...valid,
      slides: [{ role: "point", counter: "1/1", eyebrow: "E", headline: "H", body: "b",
        card: { icon: "lucide:box", title: "T", body: "B", tone: "turquoise" } }],
    };
    expect(() => slidePlanSchema.parse(bad)).toThrow();
  });
});

describe("mockupSchema", () => {
  it("accepts a card mockup", () => {
    const m = mockupSchema.parse({ type: "card", icon: "lucide:box", title: "T", body: "B", tone: "peach" });
    expect(m.type).toBe("card");
  });
  it("accepts a terminal mockup", () => {
    const m = mockupSchema.parse({
      type: "terminal",
      filename: "app.ts",
      lines: [
        { text: "// hello", style: "cmt" },
        { text: "const x = 1;", style: "plain" },
      ],
    });
    expect(m.type).toBe("terminal");
  });
  it("accepts a comparison mockup", () => {
    const m = mockupSchema.parse({
      type: "comparison",
      loserLabel: "Bad", loserLine: "No types",
      winnerLabel: "Good", winnerLine: "TypeScript",
    });
    expect(m.type).toBe("comparison");
  });
  it("accepts a steps mockup with 2-4 items", () => {
    const m = mockupSchema.parse({
      type: "steps",
      items: [
        { title: "Step 1", body: "Do this" },
        { title: "Step 2", body: "Do that" },
      ],
    });
    expect(m.type).toBe("steps");
  });
  it("rejects a steps mockup with fewer than 2 items", () => {
    expect(() => mockupSchema.parse({
      type: "steps",
      items: [{ title: "Only one", body: "step" }],
    })).toThrow();
  });
  it("accepts a callout mockup", () => {
    const m = mockupSchema.parse({ type: "callout", icon: "lucide:alert-triangle", text: "Warning!" });
    expect(m.type).toBe("callout");
  });
  it("accepts a bigstat mockup", () => {
    const m = mockupSchema.parse({ type: "bigstat", number: "3×", unit: "faster", caption: "Than sync render" });
    expect(m.type).toBe("bigstat");
  });
  it("accepts a bigstat without unit", () => {
    const m = mockupSchema.parse({ type: "bigstat", number: "80%", caption: "Less code" });
    expect(m.type).toBe("bigstat");
  });
  it("accepts a point slide with mockup field", () => {
    const plan = slidePlanSchema.parse({
      ...valid,
      slides: [
        { role: "cover", eyebrow: "TEST", headline: "Test" },
        {
          role: "point", counter: "01/03", eyebrow: "E", headline: "H", body: "b",
          mockup: { type: "terminal", filename: "x.ts", lines: [{ text: "hi", style: "plain" }] },
        },
        { role: "outro", headline: "Done" },
      ],
    });
    const point = plan.slides[1];
    expect(point.role).toBe("point");
    if (point.role === "point") {
      expect(point.mockup?.type).toBe("terminal");
    }
  });
  it("rejects point slide body exceeding max length limit", () => {
    const overlyLongBody = "a".repeat(200);
    expect(() => slidePlanSchema.parse({
      ...valid,
      slides: [
        { role: "point", counter: "01/01", eyebrow: "TEST", headline: "H", body: overlyLongBody },
      ],
    })).toThrow();
  });
});
