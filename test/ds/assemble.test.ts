import { describe, it, expect } from "vitest";
import { assembleCarousel } from "@/lib/ds/assemble";

const plan = {
  title: 'Title "quoted"',
  caption: "line1\nline2",
  hashtags: ["backend", "api"],
  slides: [
    { role: "cover", eyebrow: "BACKEND", headline: "Idempotency", accentWord: "Idempotency" },
    { role: "outro", headline: "Follow" },
  ],
} as const;

describe("assembleCarousel", () => {
  it("produces one document with a section per slide", () => {
    const html = assembleCarousel(plan);
    expect(html).toContain("<!DOCTYPE html>");
    expect((html.match(/<section\s/g) ?? []).length).toBe(2);
    expect(html).toContain("<style>");
    expect(html).toContain("width: 1080px");
  });
  it("embeds a valid vourdev-meta JSON block", () => {
    const html = assembleCarousel(plan);
    const m = html.match(/<script type="application\/json" id="vourdev-meta">([\s\S]*?)<\/script>/);
    expect(m).not.toBeNull();
    const meta = JSON.parse(m![1]);
    expect(meta.title).toBe('Title "quoted"');
    expect(meta.caption).toBe("line1\nline2");
    expect(meta.hashtags).toEqual(["backend", "api"]);
  });
});
