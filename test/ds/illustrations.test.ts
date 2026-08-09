import { describe, it, expect } from "vitest";
import { ILLUSTRATION_SLUGS, ILLUSTRATION_SVGS } from "@/lib/ds/illustrations.generated";
import {
  ILLUSTRATION_CATEGORIES,
  normalizeIllustration,
  renderIllustration,
} from "@/lib/ds/illustrations";
import manifest from "@/lib/ds/illustrations.manifest.json";
import { mockupSchema, slidePlanSchema } from "@/lib/ds/schema";
import { repairSlidePlan } from "@/lib/ds/repair";
import { renderSlide } from "@/lib/ds/render-slide";

describe("unDraw Illustration System", () => {
  it("exports valid generated slugs and inline SVGs", () => {
    expect(ILLUSTRATION_SLUGS.length).toBeGreaterThan(0);
    expect(Object.keys(ILLUSTRATION_SVGS).length).toEqual(ILLUSTRATION_SLUGS.length);

    for (const slug of ILLUSTRATION_SLUGS) {
      const svg = ILLUSTRATION_SVGS[slug];
      expect(svg).toBeDefined();
      expect(svg).toContain("<svg");
      expect(svg).toContain("#EE4B1A"); // Brand Ember accent recolored
    }
  });

  it("manifest categories match ILLUSTRATION_CATEGORIES", () => {
    expect(Object.keys(ILLUSTRATION_CATEGORIES)).toEqual(Object.keys(manifest));
    expect(ILLUSTRATION_CATEGORIES["database"]).toContain("server_9eix");
  });

  it("normalizeIllustration handles valid, whitespace, uppercase, and typo slugs", () => {
    expect(normalizeIllustration("server_9eix")).toBe("server_9eix");
    expect(normalizeIllustration("  SERVER_9EIX  ")).toBe("server_9eix");
    expect(normalizeIllustration("non_existent_slug_xyz")).toBe("online-learning_tgmv"); // default fallback
    expect(normalizeIllustration("")).toBe("online-learning_tgmv");
  });

  it("renderIllustration returns valid SVG and never throws", () => {
    const validSvg = renderIllustration("server_9eix");
    expect(validSvg).toContain("<svg");

    const fallbackSvg = renderIllustration("typo_slug_123");
    expect(fallbackSvg).toContain("<svg");
    expect(fallbackSvg).toEqual(renderIllustration("online-learning_tgmv"));
  });

  it("validates mockupIllustration schema with automatic slug normalization", () => {
    const rawMockup = {
      type: "illustration",
      illustrationSlug: "SERVER_9EIX",
      caption: "Server cluster analogy",
    };

    const parsed = mockupSchema.safeParse(rawMockup);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.type).toBe("illustration");
      if (parsed.data.type === "illustration") {
        expect(parsed.data.illustrationSlug).toBe("server_9eix");
      }
    }
  });

  it("repairSlidePlan passes valid illustration mockups through intact", () => {
    const plan = {
      title: "Abstract Concepts",
      caption: "Index Analogy",
      hashtags: ["fyp", "database", "sql", "backend", "vourdev"],
      slides: [
        {
          role: "point",
          counter: "02 / 05",
          eyebrow: "DATABASE INDEX",
          headline: "Index itu kayak daftar isi",
          accentWord: "daftar isi",
          body: "Bikin pencarian data jauh lebih cepat.",
          mockup: {
            type: "illustration",
            illustrationSlug: "file-manager_ivlr",
            caption: "Analogi daftar isi di buku",
          },
        },
      ],
    };

    const repaired = repairSlidePlan(plan);
    const slide = repaired.slides[0];
    expect(slide.role).toBe("point");
    if (slide.role === "point") {
      expect(slide.mockup?.type).toBe("illustration");
    }
  });

  it("renders illustration mockup in assembleCarousel / renderSlide without errors", () => {
    const slide = {
      role: "point" as const,
      counter: "03 / 08",
      eyebrow: "ANALOGI",
      headline: "Server sebagai pelayan restoran",
      accentWord: "pelayan restoran",
      body: "Menerima request dan mengembalikan response.",
      mockup: {
        type: "illustration" as const,
        illustrationSlug: normalizeIllustration("server_9eix"),
        caption: "Analogi pelayan",
      },
    };

    const html = renderSlide(slide, 2);
    expect(html).toContain("diag-illustration");
    expect(html).toContain("<svg");
    expect(html).toContain("Analogi pelayan");
  });
});
