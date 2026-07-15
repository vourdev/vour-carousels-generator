import { describe, it, expect } from "vitest";
import { slidePlanSchema } from "@/lib/ds/schema";

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
