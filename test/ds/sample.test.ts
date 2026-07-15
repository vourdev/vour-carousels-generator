import { describe, it, expect } from "vitest";
import { slidePlanSchema } from "@/lib/ds/schema";
import { samplePlan } from "@/lib/ds/sample";
import { assembleCarousel } from "@/lib/ds/assemble";

describe("samplePlan", () => {
  it("is a valid slidePlan", () => {
    expect(() => slidePlanSchema.parse(samplePlan)).not.toThrow();
  });
  it("assembles to a full document with 3 sections", () => {
    const html = assembleCarousel(samplePlan);
    expect((html.match(/<section\s/g) ?? []).length).toBe(3);
  });
});
