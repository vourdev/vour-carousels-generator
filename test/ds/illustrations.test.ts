import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ILLUSTRATION_SLUGS } from "@/lib/ds/illustrations.slugs.generated";
import { ILLUSTRATION_CATEGORIES, normalizeIllustration } from "@/lib/ds/illustrations";
import { renderIllustration } from "@/lib/ds/illustrations.server";
import manifest from "@/lib/ds/illustrations.manifest.json";
import { mockupSchema, slidePlanSchema } from "@/lib/ds/schema";
import { repairSlidePlan } from "@/lib/ds/repair";
import { renderSlide } from "@/lib/ds/render-slide";

describe("unDraw Illustration System", () => {
  it("every generated slug has an SVG file on disk, recolored to the brand accent", () => {
    expect(ILLUSTRATION_SLUGS.length).toBeGreaterThan(0);

    const dir = join(process.cwd(), "lib", "ds", "assets", "illustrations");
    for (const slug of ILLUSTRATION_SLUGS) {
      const svg = readFileSync(join(dir, `${slug}.svg`), "utf-8");
      expect(svg).toContain("<svg");
      expect(svg).toContain("#EE4B1A"); // Brand Ember accent recolored
    }
  });

  it("keeps the SVG payload out of any client-reachable module", () => {
    // render-slide must reach the SVGs only through illustrations.server, and the
    // isomorphic module must stay payload-free — this is what kept 1.5 MB of inline
    // SVG out of the browser bundle, so lock it down.
    const isomorphic = readFileSync(join(process.cwd(), "lib", "ds", "illustrations.ts"), "utf-8");
    expect(isomorphic).not.toContain("node:fs");
    expect(isomorphic).not.toContain("<svg");

    const renderSlideSrc = readFileSync(
      join(process.cwd(), "lib", "ds", "render-slide.ts"),
      "utf-8",
    );
    expect(renderSlideSrc).toContain("@/lib/ds/illustrations.server");

    const server = readFileSync(
      join(process.cwd(), "lib", "ds", "illustrations.server.ts"),
      "utf-8",
    );
    expect(server).toContain("node:fs");
  });

  it("manifest categories match ILLUSTRATION_CATEGORIES", () => {
    expect(Object.keys(ILLUSTRATION_CATEGORIES)).toEqual(Object.keys(manifest));

    // Every manifest slug must have been fetched into the generated bundle — a slug
    // that 404s at codegen time is dropped silently, so assert the two stay in sync.
    const known = new Set<string>(ILLUSTRATION_SLUGS);
    for (const [category, slugs] of Object.entries(ILLUSTRATION_CATEGORIES)) {
      expect(slugs.length).toBeGreaterThan(0);
      for (const slug of slugs) {
        expect(known, `${category} -> ${slug} missing from the generated slug list`).toContain(
          slug,
        );
      }
    }
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
    // Guards the fs read itself: a broken asset path would still return the fallback
    // SVG and pass a bare "<svg" assertion, hiding the failure behind a valid render.
    expect(validSvg).not.toEqual(renderIllustration("online-learning_tgmv"));

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
