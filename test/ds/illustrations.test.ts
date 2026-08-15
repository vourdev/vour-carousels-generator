import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ILLUSTRATION_SLUGS, ILLUSTRATION_VARIANTS } from "@/lib/ds/illustrations.slugs.generated";
import { ILLUSTRATION_CATEGORIES, normalizeIllustration } from "@/lib/ds/illustrations";
import { renderIllustration } from "@/lib/ds/illustrations.server";
import manifest from "@/lib/ds/illustrations.manifest.json";
import { mockupSchema, slidePlanSchema } from "@/lib/ds/schema";
import { repairSlidePlan } from "@/lib/ds/repair";
import { renderSlide } from "@/lib/ds/render-slide";
import { VOUR_TEAL_BRIGHT, VOUR_TEAL_DEEP } from "@/lib/ds/tokens";

describe("unDraw Illustration System", () => {
  it("every slug has both surface variants on disk, recolored to that surface's accent", () => {
    expect(ILLUSTRATION_SLUGS.length).toBeGreaterThan(0);

    const dir = join(process.cwd(), "lib", "ds", "assets", "illustrations");
    const accent = { onLight: VOUR_TEAL_DEEP, onDark: VOUR_TEAL_BRIGHT } as const;
    for (const slug of ILLUSTRATION_SLUGS) {
      for (const variant of ILLUSTRATION_VARIANTS) {
        const svg = readFileSync(join(dir, `${slug}.${variant}.svg`), "utf-8");
        expect(svg).toContain("<svg");
        expect(svg).toContain(accent[variant]);
      }
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
    const validSvg = renderIllustration("server_9eix", "onDark");
    expect(validSvg).toContain("<svg");
    // Guards the fs read itself: a broken asset path would still return the fallback
    // SVG and pass a bare "<svg" assertion, hiding the failure behind a valid render.
    expect(validSvg).not.toEqual(renderIllustration("online-learning_tgmv", "onDark"));

    const fallbackSvg = renderIllustration("typo_slug_123", "onDark");
    expect(fallbackSvg).toContain("<svg");
    expect(fallbackSvg).toEqual(renderIllustration("online-learning_tgmv", "onDark"));
  });

  it("serves a differently-recolored SVG per surface variant", () => {
    const light = renderIllustration("server_9eix", "onLight");
    const dark = renderIllustration("server_9eix", "onDark");
    expect(light).not.toEqual(dark);
    // unDraw's near-black structural fills must not survive onto the Ink canvas —
    // that is exactly what made illustrations dissolve into the background.
    expect(light).toContain(VOUR_TEAL_DEEP); // light-surface accent
    expect(dark).toContain(VOUR_TEAL_BRIGHT); // dark-surface accent
    for (const undrawDark of ["#090814", "#2f2e41", "#3f3d56"]) {
      expect(dark.toLowerCase()).not.toContain(undrawDark);
      expect(light.toLowerCase()).not.toContain(undrawDark);
    }
  });

  it("gives the AI no control over colour, size or spacing", () => {
    // The whole point of the two-variant split: the model picks slugs and nothing else.
    // If a styling field ever reappears in the schema, this fails.
    const src = readFileSync(join(process.cwd(), "lib", "ds", "schema.ts"), "utf-8");
    const block = src.slice(
      src.indexOf("const mockupIllustration"),
      src.indexOf("function migrateLegacyIllustration")
    );
    for (const banned of ["color", "colour", "size", "scale", "width", "height", "position", "gap"]) {
      expect(block.toLowerCase()).not.toContain(`${banned}:`);
    }
  });

  it("validates mockupIllustration schema with automatic slug normalization", () => {
    const parsed = mockupSchema.safeParse({
      type: "illustration",
      illustrationSlugs: ["SERVER_9EIX", " Team_85hs "],
      caption: "Server cluster analogy",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.type === "illustration") {
      expect(parsed.data.illustrationSlugs).toEqual(["server_9eix", "team_85hs"]);
    }
  });

  it("migrates the legacy illustrationSlug / illustrationSlug2 shape", () => {
    // Decks already stored in the carousels history table still carry the old keys.
    const parsed = mockupSchema.safeParse({
      type: "illustration",
      illustrationSlug: "server_9eix",
      illustrationSlug2: "server-cluster_7ugi",
      caption: "before / after",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.type === "illustration") {
      expect(parsed.data.illustrationSlugs).toEqual(["server_9eix", "server-cluster_7ugi"]);
    }
  });

  it("caps illustrations at 2 per slide", () => {
    const three = mockupSchema.safeParse({
      type: "illustration",
      illustrationSlugs: ["server_9eix", "server-cluster_7ugi", "team_85hs"],
    });
    expect(three.success).toBe(false);
    const none = mockupSchema.safeParse({ type: "illustration", illustrationSlugs: [] });
    expect(none.success).toBe(false);
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
            illustrationSlugs: ["file-manager_ivlr"],
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

  function illustrationSlide(slugs: string[], surface?: "paper" | "ink") {
    return {
      role: "point" as const,
      counter: "03 / 08",
      eyebrow: "ANALOGI",
      headline: "Server sebagai pelayan restoran",
      accentWord: "pelayan restoran",
      body: "Menerima request dan mengembalikan response.",
      ...(surface ? { surface } : {}),
      mockup: {
        type: "illustration" as const,
        illustrationSlugs: slugs.map(normalizeIllustration),
        caption: "Analogi pelayan",
      },
    };
  }

  it("renders illustration mockup in assembleCarousel / renderSlide without errors", () => {
    const html = renderSlide(illustrationSlide(["server_9eix"]), 2);
    expect(html).toContain("diag-illustration");
    expect(html).toContain("illustration-group is-single");
    expect(html).toContain("<svg");
    expect(html).toContain("Analogi pelayan");
  });

  it("picks the surface variant from the slide, not from the model", () => {
    // Ink is the deck default, so an unset surface must resolve to the onDark artwork.
    const inkDefault = renderSlide(illustrationSlide(["server_9eix"]), 2);
    const ink = renderSlide(illustrationSlide(["server_9eix"], "ink"), 2);
    const paper = renderSlide(illustrationSlide(["server_9eix"], "paper"), 2);

    expect(inkDefault).toContain(VOUR_TEAL_BRIGHT);
    expect(ink).toContain(VOUR_TEAL_BRIGHT);
    expect(paper).toContain(VOUR_TEAL_DEEP);
    expect(paper).not.toContain(VOUR_TEAL_BRIGHT);
  });

  it("lays two illustrations out as one centered group, never space-between", () => {
    const html = renderSlide(illustrationSlide(["server_9eix", "server-cluster_7ugi"]), 2);
    expect(html).toContain("illustration-group is-pair");
    expect((html.match(/<div class="illus-item">/g) ?? []).length).toBe(2);

    const css = readFileSync(join(process.cwd(), "lib", "ds", "carousel-css-extra.ts"), "utf-8");
    const group = css.slice(css.indexOf(".illustration-group {"), css.indexOf(".illustration-group.is-pair"));
    expect(group).toContain("justify-content: center");
    expect(group).toContain("gap: 28px");
    expect(group).not.toContain("space-between");
  });
});
