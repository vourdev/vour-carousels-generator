import { describe, it, expect } from "vitest";
import { summarizePlanDiff } from "@/lib/memory/diff";
import type { SlidePlan } from "@/lib/ds/schema";

const base: SlidePlan = {
  title: "T",
  caption: "C",
  hashtags: ["a"],
  slides: [
    { role: "cover", eyebrow: "E", headline: "Headline lama", accentWord: "lama" },
    {
      role: "point",
      counter: "02 / 03",
      eyebrow: "P",
      headline: "Point",
      body: "body",
      mockup: { type: "callout", icon: "sparkles", text: "hi" },
    },
    { role: "outro", headline: "Bye", cta: { strong: "Simpan" } },
  ],
};

const clone = (p: SlidePlan): SlidePlan => JSON.parse(JSON.stringify(p));

describe("summarizePlanDiff", () => {
  it("names the slide and the field that changed", () => {
    const after = clone(base);
    (after.slides[0] as { headline: string }).headline = "Headline baru";
    expect(summarizePlanDiff(base, after)).toBe("slide 1 (cover): headline");
  });

  it("reports a mockup swap with both types", () => {
    const after = clone(base);
    (after.slides[1] as { mockup: unknown }).mockup = {
      type: "bigstat",
      number: "3x",
      caption: "faster",
    };
    expect(summarizePlanDiff(base, after)).toContain("mockup callout->bigstat");
  });

  it("reports an added cover hook by kind", () => {
    const after = clone(base);
    (after.slides[0] as { hook: unknown }).hook = { kind: "door", label: "DORONG" };
    expect(summarizePlanDiff(base, after)).toContain("hook->door");
  });

  it("reports deck-level and slide-count changes", () => {
    const after = clone(base);
    after.title = "New title";
    after.slides.pop();
    const out = summarizePlanDiff(base, after);
    expect(out).toContain("title");
    expect(out).toContain("removed slide 3 (outro)");
  });

  it("says so plainly when the model returned the plan unchanged", () => {
    expect(summarizePlanDiff(base, clone(base))).toBe("no structural change detected");
  });
});
