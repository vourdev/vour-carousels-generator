import { describe, it, expect } from "vitest";
import { coverHookSchema } from "@/lib/ds/schema";
import { FALLBACK_ILLUSTRATION, ILLUSTRATION_SLUGS } from "@/lib/ds/illustrations";

/**
 * This schema is a copy of the backend's, and copies drift.
 *
 * The backend gained an `illustration` cover hook on 25 Aug 2026, because a cover has no
 * `mockup` field and an illustration asked for there rendered as an empty box. A plan
 * carrying the new hook would have failed to parse here while this file still listed the
 * old six kinds — the fix would have looked like it made things worse.
 */
describe("cover hook parity with the backend schema", () => {
  it("accepts the illustration hook the backend now emits", () => {
    const res = coverHookSchema.safeParse({
      kind: "illustration",
      illustrationSlugs: [ILLUSTRATION_SLUGS[0]],
      caption: "analogi",
    });
    expect(res.success).toBe(true);
  });

  it("normalizes an unknown slug the same way the backend does", () => {
    const res = coverHookSchema.parse({
      kind: "illustration",
      illustrationSlugs: ["not-a-real-slug_zzzz"],
    });
    expect(res).toMatchObject({ illustrationSlugs: [FALLBACK_ILLUSTRATION] });
  });

  it("still accepts every kind that existed before", () => {
    const kinds = [
      { kind: "device", lines: [{ text: "npm run dev" }] },
      { kind: "custom", html: "<div></div>" },
      { kind: "badge", role: "DevOps" },
      { kind: "nocgrid" },
      { kind: "door" },
      { kind: "image", src: "https://cdn.vour.dev/x.jpg" },
    ];
    for (const k of kinds) {
      expect(coverHookSchema.safeParse(k).success, JSON.stringify(k)).toBe(true);
    }
  });
});
