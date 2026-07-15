# Vour Carousels SaaS — Plan 2: Design-System Render Core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a typed, zod-validated `slidePlan` object into an on-brand carousel HTML document assembled from the Vour Dev Design System template, and preview it live in an `<iframe srcdoc>` — no AI and no image export yet.

**Architecture:** The design system's canonical template (`Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html`) provides one pre-styled `<section>` per slide role plus one shared inline `<style>` block. We vendor the `<style>` block and the per-role section markup into the app as data-driven templates (bracket placeholders → `{{named}}` slots), then fill them from a typed `slidePlan` and concatenate into a full HTML document. A protected `/preview` page renders a hardcoded sample plan in an iframe. This honors the design system rule "never write HTML from scratch" — every byte of markup/CSS is copied verbatim from the template; we only parameterize the editable slots.

**Tech Stack:** TypeScript · zod · React (Next.js App Router) · Vitest. (No new runtime deps.)

## Global Constraints

- App root is the repo root (post-restructure). Imports use `@/*` → repo root.
- Canvas is **1080 × 1350** per `<section>`. Never change section dimensions or the shared `<style>` block — copy it verbatim from the template.
- **Never author carousel HTML/CSS from scratch.** All section markup and the `<style>` block are copied verbatim from `Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html`; only the `[bracketed]` placeholder slots become fillable.
- Editorial tokens are already in the copied CSS (`#FBF6EF` paper, `#1F0904` ink, `#E94B19` orange). Do not re-derive colors/fonts.
- Every assembled document includes exactly one `<script type="application/json" id="vourdev-meta">` block in `<head>` with keys `title`, `caption`, `hashtags` — never omit a key (`""` / `[]` for missing). (`DESIGN.md §15`.)
- Text values from the plan are HTML-escaped when filled into templates (they will later come from AI/user input).
- MVP role set is **cover, point, outro**. Other roles are out of scope for this plan.
- Every task ends green (`npm test`) and is committed on branch `vour-carousels-saas`.

---

### Task 1: Vendor the shared carousel CSS + brand mark

**Files:**
- Create: `lib/ds/carousel-css.ts`
- Create: `lib/ds/brand.ts`
- Create: `test/ds/carousel-css.test.ts`

**Interfaces:**
- Produces:
  - `lib/ds/carousel-css.ts` exports `export const carouselCss: string` — the exact contents of the `<style>…</style>` block from `Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html` (CSS only, without the surrounding `<style>` tags).
  - `lib/ds/brand.ts` exports `export const brandMarkDataUri: string` — the brand mark as a `data:image/...;base64,…` string, copied from `Vour Dev Design System/DESIGN.md §3a` (or `bundle/DESIGN.md §3a`).

- [ ] **Step 1: Write the failing test `test/ds/carousel-css.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { carouselCss } from "@/lib/ds/carousel-css";
import { brandMarkDataUri } from "@/lib/ds/brand";

describe("vendored design-system assets", () => {
  it("carouselCss carries the locked section dimensions", () => {
    expect(carouselCss).toContain("width: 1080px");
    expect(carouselCss).toContain("height: 1350px");
    expect(carouselCss).not.toContain("<style>");
  });
  it("brandMarkDataUri is a base64 data URI", () => {
    expect(brandMarkDataUri.startsWith("data:image/")).toBe(true);
    expect(brandMarkDataUri).toContain(";base64,");
    expect(brandMarkDataUri.length).toBeGreaterThan(1000);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL** — `cd /Users/zero/Projects/vour-carousels && npx vitest run test/ds/carousel-css.test.ts` → FAIL (modules missing).

- [ ] **Step 3: Create `lib/ds/carousel-css.ts`**

Open `Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html`, find the single `<style> … </style>` block in `<head>` (begins with the `DO NOT EDIT THIS STYLE BLOCK` comment). Copy its **inner CSS verbatim** (not the `<style>` tags) into a template literal:

```ts
// Verbatim from Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html <style> block.
// DO NOT EDIT — regenerate by re-copying if the design system updates.
export const carouselCss = String.raw`
/* …exact CSS copied from the template's <style> block… */
`;
```
Use `String.raw` to avoid escaping issues. Do not alter any rule.

- [ ] **Step 4: Create `lib/ds/brand.ts`**

From `Vour Dev Design System/DESIGN.md` §3a (brand mark base64) — or `bundle/DESIGN.md §3a` — copy the full `data:image/...;base64,…==` string (the complete blob, first char through trailing `==`):

```ts
// Verbatim brand mark from DESIGN.md §3a. Never truncate the base64 blob.
export const brandMarkDataUri = "data:image/png;base64,AAAA…==";
```

- [ ] **Step 5: Run test, expect PASS** — `npx vitest run test/ds/carousel-css.test.ts` → PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/ds/carousel-css.ts lib/ds/brand.ts test/ds/carousel-css.test.ts
git commit -m "feat(ds): vendor shared carousel CSS and brand mark"
```

---

### Task 2: slidePlan zod schema (cover, point, outro)

**Files:**
- Create: `lib/ds/schema.ts`
- Create: `test/ds/schema.test.ts`

**Interfaces:**
- Produces `lib/ds/schema.ts`:
  - `export const slideSchema` (a `z.discriminatedUnion("role", […])`)
  - `export const slidePlanSchema` = `z.object({ title, caption, hashtags, slides })`
  - `export type SlidePlan = z.infer<typeof slidePlanSchema>`
  - `export type Slide = z.infer<typeof slideSchema>`
  - Role field shapes:
    - `cover`: `{ role:"cover", eyebrow:string, headline:string, accentWord?:string, lede?:string }`
    - `point`: `{ role:"point", counter:string, eyebrow:string, headline:string, accentWord?:string, body:string, card?:{ icon:string, title:string, body:string, tone:"peach"|"stone"|"mint"|"sky"|"pink"|"amber" } }`
    - `outro`: `{ role:"outro", headline:string, accentWord?:string, body?:string }`

- [ ] **Step 1: Write the failing test `test/ds/schema.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test, expect FAIL** — `npx vitest run test/ds/schema.test.ts` → FAIL (module missing).

- [ ] **Step 3: Create `lib/ds/schema.ts`**

```ts
import { z } from "zod";

const cardTone = z.enum(["peach", "stone", "mint", "sky", "pink", "amber"]);

const coverSlide = z.object({
  role: z.literal("cover"),
  eyebrow: z.string(),
  headline: z.string(),
  accentWord: z.string().optional(),
  lede: z.string().optional(),
});

const pointSlide = z.object({
  role: z.literal("point"),
  counter: z.string(),
  eyebrow: z.string(),
  headline: z.string(),
  accentWord: z.string().optional(),
  body: z.string(),
  card: z
    .object({
      icon: z.string(),
      title: z.string(),
      body: z.string(),
      tone: cardTone,
    })
    .optional(),
});

const outroSlide = z.object({
  role: z.literal("outro"),
  headline: z.string(),
  accentWord: z.string().optional(),
  body: z.string().optional(),
});

export const slideSchema = z.discriminatedUnion("role", [coverSlide, pointSlide, outroSlide]);

export const slidePlanSchema = z.object({
  title: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  slides: z.array(slideSchema).min(1),
});

export type Slide = z.infer<typeof slideSchema>;
export type SlidePlan = z.infer<typeof slidePlanSchema>;
```

- [ ] **Step 4: Add zod (if not already installed)** — `npm install zod` (skip if `zod` already in `package.json`).

- [ ] **Step 5: Run test, expect PASS** — `npx vitest run test/ds/schema.test.ts` → PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/ds/schema.ts test/ds/schema.test.ts package.json package-lock.json
git commit -m "feat(ds): add slidePlan zod schema for cover/point/outro"
```

---

### Task 3: Template fill helper (escaping + optional blocks)

**Files:**
- Create: `lib/ds/fill.ts`
- Create: `test/ds/fill.test.ts`

**Interfaces:**
- Produces `lib/ds/fill.ts`:
  - `export function escapeHtml(s: string): string`
  - `export function fillTemplate(template: string, vars: Record<string, string>): string` — replaces every `{{key}}` with `escapeHtml(vars[key])`; a `{{key}}` with no matching var becomes `""`. Also supports optional blocks: `{{#key}}…{{/key}}` is kept when `vars[key]` is a non-empty string, else removed (the inner `{{…}}` still filled). Raw (pre-escaped) insertion via `{{{key}}}` is NOT supported — all values are escaped.

- [ ] **Step 1: Write the failing test `test/ds/fill.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { escapeHtml, fillTemplate } from "@/lib/ds/fill";

describe("escapeHtml", () => {
  it("escapes angle brackets, ampersand, quotes", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});

describe("fillTemplate", () => {
  it("fills named slots with escaped values", () => {
    expect(fillTemplate("Hi {{name}}", { name: "<b>" })).toBe("Hi &lt;b&gt;");
  });
  it("blanks unknown slots", () => {
    expect(fillTemplate("a{{x}}b", {})).toBe("ab");
  });
  it("keeps an optional block when its key is non-empty", () => {
    expect(fillTemplate("{{#lede}}<p>{{lede}}</p>{{/lede}}", { lede: "hi" })).toBe("<p>hi</p>");
  });
  it("drops an optional block when its key is empty/absent", () => {
    expect(fillTemplate("x{{#lede}}<p>{{lede}}</p>{{/lede}}y", {})).toBe("xy");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL** — `npx vitest run test/ds/fill.test.ts` → FAIL.

- [ ] **Step 3: Create `lib/ds/fill.ts`**

```ts
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  // 1. Resolve optional blocks {{#key}}…{{/key}} first.
  let out = template.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_m, key: string, inner: string) => (vars[key] ? inner : "")
  );
  // 2. Replace named slots {{key}} with escaped values (blank if missing).
  out = out.replace(/\{\{(\w+)\}\}/g, (_m, key: string) =>
    vars[key] != null ? escapeHtml(vars[key]) : ""
  );
  return out;
}
```

- [ ] **Step 4: Run test, expect PASS** — `npx vitest run test/ds/fill.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ds/fill.ts test/ds/fill.test.ts
git commit -m "feat(ds): add escaping template-fill helper"
```

---

### Task 4: Per-role section templates (cover, point, outro)

**Files:**
- Create: `lib/ds/templates/cover.ts`
- Create: `lib/ds/templates/point.ts`
- Create: `lib/ds/templates/outro.ts`
- Create: `lib/ds/render-slide.ts`
- Create: `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `Slide` (Task 2), `fillTemplate` (Task 3), `brandMarkDataUri` (Task 1).
- Produces:
  - Each `lib/ds/templates/<role>.ts` exports `export const <role>Template: string` — the exact `<section>…</section>` markup for that role, copied verbatim from `Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html`, with the section's `[bracket]` placeholders rewritten as `{{slot}}` markers matching the schema field names (and `{{#card}}…{{/card}}`, `{{#lede}}…{{/lede}}`, `{{#body}}…{{/body}}` for optional blocks). The brand-mark `<img src>` uses `{{brand}}`.
  - `lib/ds/render-slide.ts` exports `export function renderSlide(slide: Slide): string` — dispatches on `slide.role`, builds the `vars` map (including `brand: brandMarkDataUri`, `accentWord` handling, and card sub-fields flattened as `cardIcon`/`cardTitle`/`cardBody`/`cardTone`), and returns `fillTemplate(template, vars)`.

  Headline accent: the template wraps one word in `<span class="a">`. `renderSlide` splits `headline` on the first occurrence of `accentWord` (if provided) and passes `headlineHtml` — but since `fillTemplate` escapes everything, expose the accent via three plain slots instead: `{{headlinePre}}`, `{{accentWord}}`, `{{headlinePost}}` inside a `<h1>{{headlinePre}}<span class="a">{{accentWord}}</span>{{headlinePost}}</h1>` structure in the template. When `accentWord` is absent, `headlinePre` = full headline, `accentWord`/`headlinePost` = "".

- [ ] **Step 1: Write the failing test `test/ds/render-slide.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test, expect FAIL** — `npx vitest run test/ds/render-slide.test.ts` → FAIL.

- [ ] **Step 3: Create the three template files**

For each role, locate its `<section>` in `Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html` by its role comment:
  - cover → `SLIDE 1 · COVER`
  - point → the POINT slide (info-card variant)
  - outro → the editorial outro slide

Copy the section markup **verbatim** into `export const <role>Template = String.raw\`…\`;`, then:
  1. Replace the headline markup so the accent uses `<h1 …>{{headlinePre}}<span class="a">{{accentWord}}</span>{{headlinePost}}</h1>`.
  2. Replace each remaining `[placeholder]` with the matching `{{slot}}` (`{{eyebrow}}`, `{{counter}}`, `{{body}}`, etc.).
  3. Wrap optional regions: cover lede in `{{#lede}}…{{/lede}}`; point info-card in `{{#card}}…{{/card}}` using `{{cardIcon}}`, `{{cardTitle}}`, `{{cardBody}}`, and tone class `card-{{cardTone}}`; outro body in `{{#body}}…{{/body}}`.
  4. Point the brand-mark image to `src="{{brand}}"`.
Do not otherwise alter classes, structure, or inline layout.

- [ ] **Step 4: Create `lib/ds/render-slide.ts`**

```ts
import type { Slide } from "@/lib/ds/schema";
import { fillTemplate } from "@/lib/ds/fill";
import { brandMarkDataUri } from "@/lib/ds/brand";
import { coverTemplate } from "@/lib/ds/templates/cover";
import { pointTemplate } from "@/lib/ds/templates/point";
import { outroTemplate } from "@/lib/ds/templates/outro";

function splitHeadline(headline: string, accentWord?: string) {
  if (!accentWord) return { headlinePre: headline, accentWord: "", headlinePost: "" };
  const i = headline.indexOf(accentWord);
  if (i < 0) return { headlinePre: headline, accentWord: "", headlinePost: "" };
  return {
    headlinePre: headline.slice(0, i),
    accentWord,
    headlinePost: headline.slice(i + accentWord.length),
  };
}

export function renderSlide(slide: Slide): string {
  const brand = brandMarkDataUri;
  switch (slide.role) {
    case "cover":
      return fillTemplate(coverTemplate, {
        brand,
        eyebrow: slide.eyebrow,
        ...splitHeadline(slide.headline, slide.accentWord),
        lede: slide.lede ?? "",
      });
    case "point":
      return fillTemplate(pointTemplate, {
        brand,
        counter: slide.counter,
        eyebrow: slide.eyebrow,
        ...splitHeadline(slide.headline, slide.accentWord),
        body: slide.body,
        card: slide.card ? "1" : "",
        cardIcon: slide.card?.icon ?? "",
        cardTitle: slide.card?.title ?? "",
        cardBody: slide.card?.body ?? "",
        cardTone: slide.card?.tone ?? "peach",
      });
    case "outro":
      return fillTemplate(outroTemplate, {
        brand,
        ...splitHeadline(slide.headline, slide.accentWord),
        body: slide.body ?? "",
      });
  }
}
```

Note: `card-{{cardTone}}` in the template is a class name, not text; `cardTone` values come from the enum so escaping them is harmless. `cardIcon` is used as an Iconify `icon="{{cardIcon}}"` attribute value — escaping is correct there too.

- [ ] **Step 5: Run test, expect PASS** — `npx vitest run test/ds/render-slide.test.ts` → PASS. (If the `card-` assertion fails because the copied point section always contains a card, adjust the template so the whole card block is inside `{{#card}}…{{/card}}` and re-run.)

- [ ] **Step 6: Commit**

```bash
git add lib/ds/templates lib/ds/render-slide.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): add cover/point/outro section templates and renderer"
```

---

### Task 5: Document assembler (slidePlan → full HTML)

**Files:**
- Create: `lib/ds/assemble.ts`
- Create: `test/ds/assemble.test.ts`

**Interfaces:**
- Consumes: `SlidePlan` (Task 2), `renderSlide` (Task 4), `carouselCss` (Task 1).
- Produces `lib/ds/assemble.ts`:
  - `export function assembleCarousel(plan: SlidePlan): string` — returns a complete HTML document string: `<!DOCTYPE html><html lang="id"><head>` with the Google Fonts link, the Iconify script, the `vourdev-meta` JSON block (from `plan.title/caption/hashtags`, JSON-stringified so it is valid JSON), and `<style>${carouselCss}</style>`; `<body>` = `plan.slides.map(renderSlide).join("\n")`.

- [ ] **Step 1: Write the failing test `test/ds/assemble.test.ts`**

```ts
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
    expect((html.match(/<section/g) ?? []).length).toBe(2);
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
```

- [ ] **Step 2: Run test, expect FAIL** — `npx vitest run test/ds/assemble.test.ts` → FAIL.

- [ ] **Step 3: Create `lib/ds/assemble.ts`**

```ts
import type { SlidePlan } from "@/lib/ds/schema";
import { renderSlide } from "@/lib/ds/render-slide";
import { carouselCss } from "@/lib/ds/carousel-css";

export function assembleCarousel(plan: SlidePlan): string {
  const meta = JSON.stringify(
    { title: plan.title, caption: plan.caption, hashtags: plan.hashtags },
    null,
    2
  );
  const body = plan.slides.map(renderSlide).join("\n");
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Nunito:wght@500;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
<script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>
<script type="application/json" id="vourdev-meta">
${meta}
</script>
<style>${carouselCss}</style>
</head>
<body>
${body}
</body>
</html>`;
}
```

- [ ] **Step 4: Run test, expect PASS** — `npx vitest run test/ds/assemble.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ds/assemble.ts test/ds/assemble.test.ts
git commit -m "feat(ds): assemble slidePlan into full carousel HTML document"
```

---

### Task 6: Sample plan + protected `/preview` iframe page

**Files:**
- Create: `lib/ds/sample.ts`
- Create: `app/preview/page.tsx`
- Create: `app/preview/preview-frame.tsx`
- Create: `test/ds/sample.test.ts`

**Interfaces:**
- Consumes: `slidePlanSchema`/`SlidePlan` (Task 2), `assembleCarousel` (Task 5), `requireSession` (Plan 1 `lib/session.ts`).
- Produces:
  - `lib/ds/sample.ts` exports `export const samplePlan: SlidePlan` — a 3-slide plan (cover, point-with-card, outro) that PARSES against `slidePlanSchema`.
  - `app/preview/preview-frame.tsx` — a client component `PreviewFrame({ html }: { html: string })` rendering `<iframe srcDoc={html} style={{width:540,height:675,border:"1px solid var(--ed-ink-faint)"}} />` (half-scale 1080×1350 for phone viewing) inside a scrollable wrapper.
  - `app/preview/page.tsx` — a protected server component that calls `requireSession()`, assembles `samplePlan`, and renders `<PreviewFrame html={html} />`.

- [ ] **Step 1: Write the failing test `test/ds/sample.test.ts`**

```ts
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
    expect((html.match(/<section/g) ?? []).length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL** — `npx vitest run test/ds/sample.test.ts` → FAIL.

- [ ] **Step 3: Create `lib/ds/sample.ts`**

```ts
import type { SlidePlan } from "@/lib/ds/schema";

export const samplePlan: SlidePlan = {
  title: "Idempotency di API — Konsep Dasar",
  caption: "Kenapa retry aman kalau API-mu idempotent.\n\nSimpan biar nggak lupa!",
  hashtags: ["backend", "api", "idempotency", "vourdev"],
  slides: [
    { role: "cover", eyebrow: "BACKEND 101", headline: "Idempotency itu wajib", accentWord: "Idempotency",
      lede: "Biar retry nggak bikin data dobel." },
    { role: "point", counter: "02 / 03", eyebrow: "KENAPA", headline: "Retry itu normal", accentWord: "Retry",
      body: "Network gagal, client ulang request. Tanpa idempotency, satu aksi kejadian dua kali.",
      card: { icon: "lucide:repeat", title: "Retry-safe", body: "Request sama → hasil sama.", tone: "peach" } },
    { role: "outro", headline: "Follow @vourdev", accentWord: "@vourdev", body: "Konten backend tiap minggu." },
  ],
};
```

- [ ] **Step 4: Create `app/preview/preview-frame.tsx`**

```tsx
"use client";

export function PreviewFrame({ html }: { html: string }) {
  return (
    <div style={{ overflow: "auto", padding: 16 }}>
      <iframe
        title="carousel preview"
        srcDoc={html}
        style={{ width: 540, height: 675, border: "1px solid var(--ed-ink-faint)", borderRadius: 8 }}
      />
    </div>
  );
}
```

- [ ] **Step 5: Create `app/preview/page.tsx`**

```tsx
import { requireSession } from "@/lib/session";
import { assembleCarousel } from "@/lib/ds/assemble";
import { samplePlan } from "@/lib/ds/sample";
import { PreviewFrame } from "./preview-frame";

export default async function PreviewPage() {
  await requireSession();
  const html = assembleCarousel(samplePlan);
  return (
    <main style={{ maxWidth: 720, margin: "4vh auto", padding: 24 }}>
      <h1 style={{ fontSize: 40, marginBottom: 16 }}>Preview</h1>
      <PreviewFrame html={html} />
    </main>
  );
}
```

Note: the `<iframe srcDoc>` renders the full assembled document (its own fonts/Iconify/CSS), so the 540×675 frame shows one 1080×1350 slide scaled by the browser; scroll within the iframe to see all slides. (Multi-slide layout polish — thumbnails, per-slide nav — is deferred to a later plan.)

- [ ] **Step 6: Run test, expect PASS** — `npx vitest run test/ds/sample.test.ts` → PASS.

- [ ] **Step 7: Full suite + build + manual check**

Run:
```bash
npm test && npm run build
```
Expected: all tests pass; `next build` succeeds (a `/preview` route appears in the route list).
Manual (optional): `npm run dev`, sign in, open `/preview`, confirm the carousel renders on-brand (cream bg, orange accent word, brand disc, info card).

- [ ] **Step 8: Commit**

```bash
git add lib/ds/sample.ts app/preview test/ds/sample.test.ts
git commit -m "feat(ds): add sample plan and protected /preview iframe page"
```

---

## Self-Review

**Spec coverage (Plan 2 slice = spec §3 vendoring, §4 render path minus AI/export):**
- §3 vendor DS into app (CSS, brand, templates) → Tasks 1, 4.
- §4 zod-validated slidePlan → Task 2.
- §4 template-slot injection (copy section markup, fill slots) → Tasks 3, 4.
- §4 assemble into full HTML + `vourdev-meta` (§15) → Task 5.
- §4 `<iframe srcdoc>` live preview → Task 6.
- Correctly deferred: AI generation (Plan 4), html-to-image export (Plan 3), chat revise (Plan 4), remaining ~25 roles (incremental).

**Placeholder scan:** Logic code (schema, fill, renderer dispatch, assembler, sample, iframe) is complete in-plan. The large verbatim assets (shared `<style>`, per-role `<section>` markup, brand base64) are intentionally NOT duplicated into the plan — they are copied verbatim from the named in-repo source files with exact role-marker references, which is the correct DRY handling for vendoring existing design-system artifacts (duplicating hundreds of lines of CSS/HTML into the plan would risk drift from the source of truth).

**Type consistency:** `SlidePlan`/`Slide` (schema.ts) flow into `renderSlide` (render-slide.ts), `assembleCarousel` (assemble.ts), and `samplePlan` (sample.ts). `fillTemplate`/`escapeHtml` (fill.ts) consumed by render-slide.ts. `carouselCss` (carousel-css.ts) + `brandMarkDataUri` (brand.ts) consumed by assemble.ts / render-slide.ts. `requireSession` (Plan 1) consumed by preview page. Slot names in the template files (`{{headlinePre}}`, `{{accentWord}}`, `{{headlinePost}}`, `{{eyebrow}}`, `{{counter}}`, `{{body}}`, `{{lede}}`, `{{card}}`, `{{cardIcon}}`, `{{cardTitle}}`, `{{cardBody}}`, `{{cardTone}}`, `{{brand}}`) must match exactly the keys produced in `renderSlide` — Task 4 Step 3/4 define both sides.
