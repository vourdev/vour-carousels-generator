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

  it("renders a point with fallback card when no mockup/card", () => {
    const html = renderSlide({ role: "point", counter: "02 / 05", eyebrow: "WHY", headline: "It matters", body: "because." });
    expect(html).toContain("02 / 05");
    expect(html).toContain("card-peach");
  });

  it("renders a point WITH a legacy card when provided", () => {
    const html = renderSlide({ role: "point", counter: "1/1", eyebrow: "E", headline: "H", body: "b",
      card: { icon: "lucide:box", title: "Title", body: "Body", tone: "peach" } });
    expect(html).toContain("card-peach");
    expect(html).toContain("lucide:box");
  });

  it("renders a terminal mockup with mac chrome", () => {
    const html = renderSlide({
      role: "point", counter: "02/07", eyebrow: "CODE", headline: "Test", body: "desc",
      mockup: {
        type: "terminal",
        filename: "auth.ts",
        lines: [
          { text: "// verify token", style: "cmt" },
          { text: 'const secret = "abc";', style: "plain" },
          { text: "jwt.verify(token)", style: "kw" },
        ],
      },
    });
    expect(html).toContain("terminal-bar");
    expect(html).toContain("auth.ts");
    expect(html).toContain('class="cmt"');
    expect(html).toContain('class="kw"');
    expect(html).not.toContain("card-peach");
  });

  it("renders a comparison mockup with loser and winner panels", () => {
    const html = renderSlide({
      role: "point", counter: "03/07", eyebrow: "VS", headline: "Compare", body: "desc",
      mockup: {
        type: "comparison",
        loserLabel: "Base64",
        loserLine: "Bisa di-decode siapa aja",
        winnerLabel: "AES Encryption",
        winnerLine: "Butuh key untuk decrypt",
        winnerRationale: "Enkripsi melindungi data",
      },
    });
    expect(html).toContain("diag-bars");
    expect(html).toContain("panel loser");
    expect(html).toContain("Base64");
    expect(html).toContain("AES Encryption");
    expect(html).toContain("Enkripsi melindungi data");
    expect(html).not.toContain("card-peach");
  });

  it("renders a steps mockup with numbered badges", () => {
    const html = renderSlide({
      role: "point", counter: "05/07", eyebrow: "HOW TO", headline: "Steps", body: "desc",
      mockup: {
        type: "steps",
        items: [
          { title: "Install deps", body: "npm install" },
          { title: "Configure", body: "Set env vars" },
          { title: "Deploy", body: "Run build" },
        ],
      },
    });
    expect(html).toContain("card-amber");
    expect(html).toContain("Install deps");
    expect(html).toContain("Configure");
    expect(html).toContain("Deploy");
    expect(html).not.toContain("card-peach");
  });

  it("renders a callout mockup as dark banner", () => {
    const html = renderSlide({
      role: "point", counter: "04/07", eyebrow: "WARNING", headline: "Caution", body: "desc",
      mockup: {
        type: "callout",
        icon: "lucide:alert-triangle",
        text: "Never store secrets in JWT payload",
      },
    });
    expect(html).toContain("background:#1F0904");
    expect(html).toContain("lucide:alert-triangle");
    expect(html).toContain("Never store secrets in JWT payload");
    expect(html).not.toContain("card-peach");
  });

  it("renders a bigstat mockup with large number", () => {
    const html = renderSlide({
      role: "point", counter: "03/07", eyebrow: "METRIC", headline: "Speed", body: "desc",
      mockup: {
        type: "bigstat",
        number: "3×",
        unit: "faster",
        caption: "Concurrent render vs sync render",
      },
    });
    expect(html).toContain("font-size:96px");
    expect(html).toContain("3×");
    expect(html).toContain("faster");
    expect(html).toContain("Concurrent render vs sync render");
    expect(html).not.toContain("card-peach");
  });

  it("prefers mockup over legacy card field", () => {
    const html = renderSlide({
      role: "point", counter: "02/05", eyebrow: "E", headline: "H", body: "b",
      card: { icon: "lucide:box", title: "Card Title", body: "Card Body", tone: "mint" },
      mockup: { type: "callout", icon: "lucide:check-circle", text: "Mockup wins" },
    });
    expect(html).toContain("Mockup wins");
    expect(html).not.toContain("Card Title");
  });

  it("escapes user text", () => {
    const html = renderSlide({ role: "outro", headline: "<script>x" });
    expect(html).not.toContain("<script>x");
    expect(html).toContain("&lt;script&gt;x");
  });
});
