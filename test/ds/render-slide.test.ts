import { describe, it, expect } from "vitest";
import { renderSlide } from "@/lib/ds/render-slide";

describe("renderSlide", () => {
  it("renders a cover with an accent span", () => {
    const html = renderSlide({ role: "cover", eyebrow: "BACKEND", headline: "Idempotency now", accentWord: "Idempotency" });
    expect(html).toContain("<section");
    expect(html).toContain('class="a"');
    expect(html).toContain("Idempotency");
    expect(html).toContain("BACKEND");
  });
  it("renders a point without a card when card is absent", () => {
    const html = renderSlide({ role: "point", counter: "02 / 05", eyebrow: "WHY", headline: "It matters", body: "because." });
    expect(html).toContain("02 / 05");
    expect(html).not.toContain("card-"); // no info-card tone class emitted
  });
  it("renders a point WITH a card when provided", () => {
    const html = renderSlide({ role: "point", counter: "1/1", eyebrow: "E", headline: "H", body: "b",
      card: { icon: "lucide:box", title: "Title", body: "Body", tone: "peach" } });
    expect(html).toContain("card-peach");
    expect(html).toContain("lucide:box");
  });
  it("escapes user text", () => {
    const html = renderSlide({ role: "outro", headline: "<script>x" });
    expect(html).not.toContain("<script>x");
    expect(html).toContain("&lt;script&gt;x");
  });
});
