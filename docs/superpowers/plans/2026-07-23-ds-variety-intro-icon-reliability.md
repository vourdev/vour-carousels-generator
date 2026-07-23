# DS Variety, Editorial Intro & Icon Reliability — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make carousel icons render reliably (preview + PNG export) via a self-hosted, allowlisted inline-SVG set with no CDN, add a proportional text-only editorial cover intro, and make AI-generated decks visually varied.

**Architecture:** Icons become committed inline `<svg>` strings generated from the installed `lucide-react` by a codegen script (mirrors the existing `fonts-inline` pattern). A tiny `icons.ts` API validates/normalizes any incoming slug to the allowlist (fallback `sparkles`) and renders the SVG. Templates inject the SVG via the same raw-injection sentinel pattern already used for mockups/hooks. The Iconify CDN script and the export-time icon-fetch/wait code are deleted. A separate appended stylesheet adds the editorial-intro layout without touching the verbatim DS-bundle CSS block. Prompt few-shot examples and the sample deck are enriched to exercise all six mockups.

**Tech Stack:** TypeScript, Next.js 16 (App Router — untouched here), Zod, Vitest, `lucide-react` v1.24.0, `html-to-image`.

## Global Constraints

- Canvas is fixed **1080×1350**; copy budgets must not overflow it (headline ≤ 90 chars/≤ 7 words, body ≤ 160 chars, per-mockup caps in `lib/ai/prompts.ts`).
- Icon color default is **`#E94B19`** (brand orange) — current templates hardcode it; preserve it.
- Icons are **lucide** line style only: `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`.
- Fonts are already inlined and on-theme (**Sora / Nunito / JetBrains Mono**) — do not change them.
- The DS-bundle CSS block in `lib/ds/carousel-css.ts` is marked **DO NOT EDIT**; only the one dead `iconify-icon` selector may change (a required consequence of removing Iconify). All *new* styles go in a separate file.
- Every icon referenced anywhere (sample deck, prompt examples, tests) MUST be in the allowlist.
- Test runner: `npm test` (`vitest run`). Follow existing `test/ds/*` and `test/ai/*` style.
- AGENTS.md: this Next.js is customized — consult `node_modules/next/dist/docs/` before touching any App Router code. This plan touches none; if that changes, read first.

**The allowlist (36 slugs, all verified present in lucide-react v1.24.0):**

```
terminal, server, database, key, shield-check, lock, git-branch, code, cpu,
network, cloud, zap, repeat, arrow-right, alert-triangle, check-circle,
x-circle, circle-alert, sparkles, layers, box, workflow, timer, gauge, bug,
wrench, rocket, book-open, lightbulb, target, trending-up, file-code, braces,
webhook, refresh-cw, folder
```

`sparkles` is the guaranteed fallback.

---

### Task 1: Icon codegen → committed generated SVG map

**Files:**
- Create: `scripts/gen-icons.mjs`
- Create (generated, committed): `lib/ds/icons.generated.ts`
- Modify: `package.json` (add `gen:icons` script)

**Interfaces:**
- Produces: `lib/ds/icons.generated.ts` exporting
  `export const ICON_SLUGS = [...36 slugs...] as const;` and
  `export const ICON_SVGS: Record<string, string>` (slug → raw inline `<svg>` string, 24×24, `stroke="currentColor"`).

- [ ] **Step 1: Write the codegen script**

Create `scripts/gen-icons.mjs`:

```js
// One-off/codegen: emit lib/ds/icons.generated.ts with inline <svg> strings for
// a curated allowlist, sourced from the installed lucide-react (authentic paths).
// Fails loudly if any slug is missing — the allowlist is strict by construction.
import { writeFileSync } from "node:fs";

const SLUGS = [
  "terminal", "server", "database", "key", "shield-check", "lock",
  "git-branch", "code", "cpu", "network", "cloud", "zap", "repeat",
  "arrow-right", "alert-triangle", "check-circle", "x-circle", "circle-alert",
  "sparkles", "layers", "box", "workflow", "timer", "gauge", "bug", "wrench",
  "rocket", "book-open", "lightbulb", "target", "trending-up", "file-code",
  "braces", "webhook", "refresh-cw", "folder",
];

// lucide default SVG envelope (matches lucide-react createLucideIcon defaults).
const OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" ' +
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round">';

function childToTag([tag, attrs]) {
  const a = Object.entries(attrs)
    .filter(([k]) => k !== "key") // React-only, not valid SVG
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<${tag} ${a}/>`;
}

const entries = [];
for (const slug of SLUGS) {
  const url = new URL(
    `../node_modules/lucide-react/dist/esm/icons/${slug}.mjs`,
    import.meta.url
  );
  let mod;
  try {
    mod = await import(url.href);
  } catch {
    throw new Error(`lucide-react has no icon "${slug}" — fix the allowlist`);
  }
  const node = mod.__iconNode;
  if (!Array.isArray(node) || node.length === 0) {
    throw new Error(`icon "${slug}" has empty __iconNode`);
  }
  const svg = OPEN + node.map(childToTag).join("") + "</svg>";
  entries.push([slug, svg]);
}

const slugsLiteral = SLUGS.map((s) => `"${s}"`).join(", ");
const svgLines = entries
  .map(([slug, svg]) => `  "${slug}": String.raw\`${svg}\`,`)
  .join("\n");

const ts = `// AUTO-GENERATED by scripts/gen-icons.mjs — do not edit by hand.
// Inline lucide SVGs for the carousel icon allowlist. Committed so rendering has
// no runtime dependency and no network (preview + PNG export both work offline).
export const ICON_SLUGS = [${slugsLiteral}] as const;

export const ICON_SVGS: Record<string, string> = {
${svgLines}
};
`;

writeFileSync(new URL("../lib/ds/icons.generated.ts", import.meta.url), ts);
console.log(`✅ wrote lib/ds/icons.generated.ts (${entries.length} icons)`);
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"` (after `"start"`):

```json
    "gen:icons": "node scripts/gen-icons.mjs",
```

- [ ] **Step 3: Run the codegen**

Run: `npm run gen:icons`
Expected: `✅ wrote lib/ds/icons.generated.ts (36 icons)` and the file exists.

- [ ] **Step 4: Sanity-check the output**

Run: `grep -c 'String.raw' lib/ds/icons.generated.ts`
Expected: `36`

Run: `grep -q 'stroke="currentColor"' lib/ds/icons.generated.ts && echo OK`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add scripts/gen-icons.mjs lib/ds/icons.generated.ts package.json
git commit -m "feat(ds): codegen inline lucide SVGs for icon allowlist"
```

---

### Task 2: Icon API — `normalizeIcon` + `renderIcon`

**Files:**
- Create: `lib/ds/icons.ts`
- Test: `test/ds/icons.test.ts`

**Interfaces:**
- Consumes: `ICON_SLUGS`, `ICON_SVGS` from `lib/ds/icons.generated.ts`.
- Produces:
  - `export type IconSlug`
  - `export function normalizeIcon(raw: string): IconSlug`
  - `export function renderIcon(raw: string, opts?: { size?: number; color?: string }): string`
  - re-exports `ICON_SLUGS`.

- [ ] **Step 1: Write the failing test**

Create `test/ds/icons.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeIcon, renderIcon, ICON_SLUGS } from "@/lib/ds/icons";
import { ICON_SVGS } from "@/lib/ds/icons.generated";

describe("normalizeIcon", () => {
  it("strips a lucide: prefix", () => {
    expect(normalizeIcon("lucide:repeat")).toBe("repeat");
  });
  it("accepts a bare valid slug", () => {
    expect(normalizeIcon("shield-check")).toBe("shield-check");
  });
  it("lowercases and trims", () => {
    expect(normalizeIcon("  Lucide:Terminal ")).toBe("terminal");
  });
  it("maps unknown / placeholder input to the sparkles fallback", () => {
    expect(normalizeIcon("lucide:slug")).toBe("sparkles");
    expect(normalizeIcon("lucide:<icon-slug>")).toBe("sparkles");
    expect(normalizeIcon("totally-made-up")).toBe("sparkles");
    expect(normalizeIcon("")).toBe("sparkles");
  });
});

describe("renderIcon", () => {
  it("returns an inline svg for a valid slug", () => {
    const svg = renderIcon("lucide:terminal");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });
  it("applies size and color", () => {
    const svg = renderIcon("terminal", { size: 40, color: "#123456" });
    expect(svg).toContain('width="40"');
    expect(svg).toContain('height="40"');
    expect(svg).toContain('stroke="#123456"');
    expect(svg).not.toContain('stroke="currentColor"');
  });
  it("defaults to brand orange", () => {
    expect(renderIcon("terminal")).toContain('stroke="#E94B19"');
  });
  it("falls back to sparkles for unknown, never empty", () => {
    const svg = renderIcon("nope");
    expect(svg).toContain("<svg");
    expect(svg).toBe(renderIcon("sparkles"));
  });
});

describe("allowlist integrity", () => {
  it("every slug has a non-empty svg in the generated map", () => {
    for (const slug of ICON_SLUGS) {
      expect(ICON_SVGS[slug], slug).toBeTruthy();
      expect(ICON_SVGS[slug]).toContain("<svg");
    }
  });
  it("includes the sparkles fallback", () => {
    expect(ICON_SLUGS).toContain("sparkles");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/icons.test.ts`
Expected: FAIL — cannot resolve `@/lib/ds/icons`.

- [ ] **Step 3: Write the implementation**

Create `lib/ds/icons.ts`:

```ts
import { ICON_SLUGS, ICON_SVGS } from "@/lib/ds/icons.generated";

export { ICON_SLUGS };
export type IconSlug = (typeof ICON_SLUGS)[number];

const FALLBACK: IconSlug = "sparkles";
const KNOWN = new Set<string>(ICON_SLUGS);

/** Strip a `lucide:` prefix, lowercase/trim, and coerce to a known slug. */
export function normalizeIcon(raw: string): IconSlug {
  const slug = (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^lucide:/, "");
  return (KNOWN.has(slug) ? slug : FALLBACK) as IconSlug;
}

/** Inline <svg> string for a slug, with size + color applied. Never empty. */
export function renderIcon(
  raw: string,
  opts: { size?: number; color?: string } = {}
): string {
  const { size = 24, color = "#E94B19" } = opts;
  const slug = normalizeIcon(raw);
  return ICON_SVGS[slug]
    .replace('width="24"', `width="${size}"`)
    .replace('height="24"', `height="${size}"`)
    .replace('stroke="currentColor"', `stroke="${color}"`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/ds/icons.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/ds/icons.ts test/ds/icons.test.ts
git commit -m "feat(ds): normalizeIcon + renderIcon over the allowlist"
```

---

### Task 3: Schema coerces icon fields to the allowlist

**Files:**
- Modify: `lib/ds/schema.ts` (card mockup `icon`, callout mockup `icon`, legacy `pointSlide.card.icon`)
- Test: `test/ds/schema.test.ts`

**Interfaces:**
- Consumes: `normalizeIcon` from `lib/ds/icons`.
- Produces: parsed `Mockup`/`Slide` where every `icon` is a valid `IconSlug` string.

- [ ] **Step 1: Write the failing test**

Add to `test/ds/schema.test.ts`:

```ts
import { mockupSchema, slideSchema } from "@/lib/ds/schema";

describe("icon coercion", () => {
  it("strips lucide: prefix on a card mockup icon", () => {
    const m = mockupSchema.parse({
      type: "card", icon: "lucide:repeat", title: "T", body: "B", tone: "peach",
    });
    expect(m.type === "card" && m.icon).toBe("repeat");
  });
  it("coerces an unknown callout icon to the fallback (no throw)", () => {
    const m = mockupSchema.parse({
      type: "callout", icon: "lucide:made-up-xyz", text: "hi",
    });
    expect(m.type === "callout" && m.icon).toBe("sparkles");
  });
  it("coerces a legacy point card icon", () => {
    const s = slideSchema.parse({
      role: "point", counter: "1/1", eyebrow: "E", headline: "H", body: "b",
      card: { icon: "lucide:box", title: "T", body: "B", tone: "mint" },
    });
    expect(s.role === "point" && s.card?.icon).toBe("box");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/schema.test.ts`
Expected: FAIL — icon values pass through unchanged (`"lucide:repeat"` not `"repeat"`).

- [ ] **Step 3: Write the implementation**

In `lib/ds/schema.ts`, add the import at the top (after `import { z }`):

```ts
import { normalizeIcon } from "@/lib/ds/icons";
```

Add a shared field just below the `cardTone` line:

```ts
const iconField = z.string().transform(normalizeIcon);
```

Replace `icon: z.string(),` in `mockupCard` (line ~10) with:

```ts
  icon: iconField,
```

Replace `icon: z.string(),` in `mockupCallout` (line ~52) with:

```ts
  icon: iconField,
```

Replace `icon: z.string(),` in the legacy `pointSlide.card` object (line ~136) with:

```ts
      icon: iconField,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/ds/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ds/schema.ts test/ds/schema.test.ts
git commit -m "feat(ds): coerce schema icon fields to the allowlist"
```

---

### Task 4: Templates + render inject inline SVG (no more iconify-icon)

**Files:**
- Modify: `lib/ds/templates/callout.ts`
- Modify: `lib/ds/templates/point.ts`
- Modify: `lib/ds/render-slide.ts`
- Test: `test/ds/render-slide.test.ts` (update icon assertions)

**Interfaces:**
- Consumes: `renderIcon` from `lib/ds/icons`.
- Produces: `renderSlide` output where card + callout icons are inline `<svg>`, never `<iconify-icon>`.

- [ ] **Step 1: Update the failing tests**

In `test/ds/render-slide.test.ts`, change the three icon assertions:

Line ~23 (legacy card test): replace
```ts
    expect(html).toContain("lucide:box");
```
with
```ts
    expect(html).toContain("<svg");
    expect(html).not.toContain("iconify-icon");
```

Line ~97 (callout test): replace
```ts
    expect(html).toContain("lucide:alert-triangle");
```
with
```ts
    expect(html).toContain("<svg");
    expect(html).not.toContain("iconify-icon");
```

Add a new test at the end of the `describe("renderSlide", …)` block:

```ts
  it("renders card icons as inline svg, never iconify-icon", () => {
    const html = renderSlide({
      role: "point", counter: "1/1", eyebrow: "E", headline: "H", body: "b",
      mockup: { type: "card", icon: "lucide:server", title: "T", body: "B", tone: "sky" },
    });
    expect(html).toContain("<svg");
    expect(html).not.toContain("iconify-icon");
    expect(html).not.toContain("ICON_INJECT");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/render-slide.test.ts`
Expected: FAIL — output still contains `iconify-icon` / `lucide:box`.

- [ ] **Step 3: Update the callout template**

In `lib/ds/templates/callout.ts`, replace the `<iconify-icon …></iconify-icon>` line with the sentinel:

```ts
        ICON_INJECT
```

So the block reads:

```ts
      <div style="min-width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;flex:none">
        ICON_INJECT
      </div>
```

- [ ] **Step 4: Update the point template**

In `lib/ds/templates/point.ts`, replace the `<iconify-icon …></iconify-icon>` line inside `.card-ico` with:

```ts
        ICON_INJECT
```

- [ ] **Step 5: Wire injection in render-slide**

In `lib/ds/render-slide.ts`, add the import (after the other `lib/ds` imports):

```ts
import { renderIcon } from "@/lib/ds/icons";
```

Replace `renderCalloutMockup` (currently returns the `fillTemplate(...)` directly) with:

```ts
function renderCalloutMockup(m: Extract<Mockup, { type: "callout" }>): string {
  const base = fillTemplate(calloutTemplate, {
    calloutText: m.text,
  });
  // Function replacer: keep raw SVG out of String.replace $-interpretation.
  return base.replace("ICON_INJECT", () => renderIcon(m.icon, { size: 24, color: "#E94B19" }));
}
```

In the `case "point"` card branch, drop the `cardIcon` var and inject after filling. Replace the card branch:

```ts
      if (mockup.type === "card") {
        const filled = fillTemplate(pointTemplate, {
          brand,
          counter: slide.counter,
          eyebrow: slide.eyebrow,
          ...splitHeadline(slide.headline, slide.accentWord),
          body: slide.body,
          card: "1",
          cardTitle: mockup.title || slide.eyebrow || "Ringkasan",
          cardBody: mockup.body || slide.body,
          cardTone: mockup.tone || "peach",
          mockupHtml: "",
        });
        // Function replacer keeps raw SVG safe from $-sequence interpretation.
        return filled.replace("ICON_INJECT", () =>
          renderIcon(mockup.icon, { size: 24, color: "#E94B19" })
        );
      }
```

In the non-card `point` branch, remove the now-unused `cardIcon: ""` line from the `fillTemplate` call (leave `cardTitle`, `cardBody`, `cardTone` as-is). The removed card block means no `ICON_INJECT` remains on that path.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- test/ds/render-slide.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/ds/templates/callout.ts lib/ds/templates/point.ts lib/ds/render-slide.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): render card/callout icons as inline svg"
```

---

### Task 5: Remove the Iconify CDN + export-time icon fetch

**Files:**
- Modify: `lib/ds/assemble.ts` (delete CDN `<script>`)
- Modify: `lib/export/capture.ts` (delete `preFetchAndReplaceIcons`, the iconify wait block, `inlineIcons`, and their call sites)
- Modify: `lib/ds/carousel-css.ts:305` (dead `iconify-icon` selector → `svg`)
- Test: `test/ds/assemble.test.ts`

**Interfaces:**
- Produces: assembled HTML with no `code.iconify.design` script and no `iconify-icon`; `captureCarousel` unchanged in signature.

- [ ] **Step 1: Write the failing test**

Add to `test/ds/assemble.test.ts`:

```ts
it("assembles without any Iconify CDN dependency", () => {
  const html = assembleCarousel(samplePlan);
  expect(html).not.toContain("iconify.design");
  expect(html).not.toContain("iconify-icon");
});
```

(If `samplePlan` isn't already imported in this file, add
`import { samplePlan } from "@/lib/ds/sample";` — check the top of the file first.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/assemble.test.ts`
Expected: FAIL — output contains the `code.iconify.design` script tag (and the `.mock-lock iconify-icon` CSS selector substring).

- [ ] **Step 3: Delete the CDN script**

In `lib/ds/assemble.ts`, delete line 18 entirely:

```
<script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>
```

- [ ] **Step 4: Fix the dead CSS selector**

In `lib/ds/carousel-css.ts` line 305, change:

```
  .mock-lock iconify-icon { font-size: 26px; }
```

to:

```
  .mock-lock svg { width: 26px; height: 26px; }
```

- [ ] **Step 5: Strip the icon-fetch/wait code from capture.ts**

In `lib/export/capture.ts`:

1. Delete the entire `preFetchAndReplaceIcons` function (the block starting at its `/** Pre-fetch SVGs … */` comment through its closing `}`).
2. Delete the entire `inlineIcons` function (its `/** Copy each <iconify-icon>'s … */` comment through its closing `}`).
3. Replace `waitForReady` with a fonts-only version:

```ts
/** Wait for fonts to load — capped so it can never hang. */
async function waitForReady(doc: Document): Promise<void> {
  await withTimeout(doc.fonts.ready, READY_TIMEOUT_MS);
  // Settle time for layout + paint.
  await new Promise<void>((r) => setTimeout(r, 100));
}
```

4. In `captureCarousel`, remove the icon calls and the now-unused `win`. The body of the `try` becomes:

```ts
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("export iframe has no document");

    await waitForReady(doc);

    const sections = Array.from(doc.querySelectorAll("section")) as HTMLElement[];
    if (!sections.length) throw new Error("no slides found to export");

    const blobs: Blob[] = [];
    for (const section of sections) {
      const blob = await toBlob(section, {
        type: "image/png",
        pixelRatio,
        width: SLIDE_W,
        height: SLIDE_H,
        skipFonts: false,
      });
      if (!blob) throw new Error("html-to-image returned no blob");
      blobs.push(blob);
    }
    return blobs;
```

- [ ] **Step 6: Run the full DS + export suite to verify it passes**

Run: `npm test -- test/ds/assemble.test.ts test/export`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors (confirms no dangling references to the deleted functions/`win`).

- [ ] **Step 7: Commit**

```bash
git add lib/ds/assemble.ts lib/ds/carousel-css.ts lib/export/capture.ts test/ds/assemble.test.ts
git commit -m "refactor(export): drop Iconify CDN + runtime icon fetch"
```

---

### Task 6: Proportional text-only editorial cover

**Files:**
- Create: `lib/ds/carousel-css-extra.ts`
- Modify: `lib/ds/templates/cover.ts` (add editorial class + lead wrapper)
- Modify: `lib/ds/assemble.ts` (append the extra stylesheet)
- Test: `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `export const carouselExtraCss: string`; the no-hook cover carries `class="cover-editorial"` and centers its lead block.

- [ ] **Step 1: Write the failing test**

In `test/ds/render-slide.test.ts`, extend the existing full-hero cover test (the one asserting `"hero"` and `"Geser"`) by adding:

```ts
    expect(html).toContain("cover-editorial");
    expect(html).toContain("cover-lead");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/render-slide.test.ts`
Expected: FAIL — `cover-editorial` not present.

- [ ] **Step 3: Add the editorial cover template markup**

In `lib/ds/templates/cover.ts`, change the opening `<section …>` to add the class, and wrap the eyebrow/headline/lede in a `.cover-lead` div. Full new template:

```ts
export const coverTemplate = String.raw`<section data-screen-label="01 · Cover" class="cover-editorial">
  <div class="brand-row">
    <div class="brand-disc">
      <img src="{{brand}}" alt="@vourdev">
    </div>
    <span class="brand-handle">@vourdev</span>
  </div>

  <div class="cover-lead">
    <div class="eyebrow">{{eyebrow}}</div>
    <h1 class="hero mt-24">{{headlinePre}}<span class="a">{{accentWord}}</span>{{headlinePost}}</h1>
    {{#lede}}
    <p class="lede mt-32">
      {{lede}}
    </p>
    {{/lede}}
  </div>

  <div class="geser">Geser →</div>
</section>`;
```

- [ ] **Step 4: Create the extra stylesheet**

Create `lib/ds/carousel-css-extra.ts`:

```ts
// Additive carousel styles that must NOT live in the verbatim DS-bundle block
// (lib/ds/carousel-css.ts is marked DO NOT EDIT). Appended after it in assemble.
export const carouselExtraCss = String.raw`
  /* Text-only editorial cover: brand-row pinned top, "Geser" pinned bottom,
     lead block optically centered on the 1080×1350 canvas. */
  .cover-editorial .cover-lead {
    margin-top: auto;
    margin-bottom: auto;
    display: flex;
    flex-direction: column;
  }
  .cover-editorial .lede { max-width: 860px; }
`;
```

- [ ] **Step 5: Append the extra stylesheet in assemble**

In `lib/ds/assemble.ts`, add the import at the top:

```ts
import { carouselExtraCss } from "@/lib/ds/carousel-css-extra";
```

And add a `<style>` line in the `<head>` right after the `carouselCss` style line:

```ts
<style>${carouselCss}</style>
<style>${carouselExtraCss}</style>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- test/ds/render-slide.test.ts test/ds/assemble.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/ds/carousel-css-extra.ts lib/ds/templates/cover.ts lib/ds/assemble.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): proportional text-only editorial cover"
```

---

### Task 7: Richer sample deck + prompt few-shot for variety & intro

**Files:**
- Modify: `lib/ds/sample.ts` (expand `samplePlan` to exercise all six mockups + text intro)
- Modify: `lib/ai/prompts.ts` (enumerate the icon allowlist; add a varied worked example + a text-intro example)
- Test: `test/ds/sample.test.ts`

**Interfaces:**
- Consumes: nothing new (data + prompt strings only).
- Produces: an enriched `samplePlan` (still valid `SlidePlan`) and prompt copy.

- [ ] **Step 1: Write the failing test**

Add to `test/ds/sample.test.ts`:

```ts
import { assembleCarousel } from "@/lib/ds/assemble";

describe("samplePlan variety", () => {
  it("exercises at least 4 distinct mockup types", () => {
    const types = new Set(
      samplePlan.slides
        .filter((s) => s.role === "point")
        .map((s) => (s as { mockup?: { type: string } }).mockup?.type)
        .filter(Boolean)
    );
    expect(types.size).toBeGreaterThanOrEqual(4);
  });
  it("has a text-only cover (no hook)", () => {
    const cover = samplePlan.slides.find((s) => s.role === "cover");
    expect(cover && "hook" in cover ? cover.hook : undefined).toBeUndefined();
  });
  it("assembles to inline-svg icons, no iconify", () => {
    const html = assembleCarousel(samplePlan);
    expect(html).toContain("<svg");
    expect(html).not.toContain("iconify-icon");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/sample.test.ts`
Expected: FAIL — current `samplePlan` has one point slide / one mockup type.

- [ ] **Step 3: Expand the sample deck**

Replace the `slides` array in `lib/ds/sample.ts` with a 7-slide deck. Keep all copy within budget and all icons in the allowlist:

```ts
  slides: [
    {
      role: "cover",
      eyebrow: "BACKEND 101",
      headline: "Idempotency itu wajib",
      accentWord: "Idempotency",
      lede: "Biar retry nggak bikin data dobel — konsep yang wajib lo ngerti, bukan cuma hafal.",
    },
    {
      role: "point",
      counter: "02 / 07",
      eyebrow: "KENAPA",
      headline: "Retry itu normal",
      accentWord: "Retry",
      body: "Network gagal, client ngulang request. Tanpa jaminan, satu aksi kejadian dua kali.",
      mockup: { type: "card", icon: "lucide:repeat", title: "Retry-safe", body: "Request sama → hasil sama.", tone: "peach" },
    },
    {
      role: "point",
      counter: "03 / 07",
      eyebrow: "CONTOH",
      headline: "Pakai Idempotency-Key",
      accentWord: "Idempotency-Key",
      body: "Kirim key unik per aksi; server nolak duplikat dengan key yang sama.",
      mockup: {
        type: "terminal",
        filename: "charge.ts",
        lines: [
          { text: "// key unik per aksi", style: "cmt" },
          { text: "await pay(order, {", style: "plain" },
          { text: '  idempotencyKey: uuid()', style: "key" },
          { text: "})", style: "plain" },
        ],
      },
    },
    {
      role: "point",
      counter: "04 / 07",
      eyebrow: "SALAH VS BENAR",
      headline: "Jangan andalkan retry buta",
      accentWord: "buta",
      body: "Retry tanpa key bikin dobel; retry dengan key aman diulang.",
      mockup: {
        type: "comparison",
        loserLabel: "Tanpa key",
        loserLine: "2× charge ke kartu user",
        winnerLabel: "Dengan key",
        winnerLine: "Charge kedua di-skip server",
        winnerRationale: "Server ingat key yang sudah diproses.",
      },
    },
    {
      role: "point",
      counter: "05 / 07",
      eyebrow: "CARA PAKAI",
      headline: "Tiga langkah aman",
      accentWord: "Tiga",
      body: "Pola minimum biar endpoint-mu idempotent.",
      mockup: {
        type: "steps",
        items: [
          { title: "Generate key", body: "UUID per aksi di client." },
          { title: "Kirim di header", body: "Idempotency-Key: <uuid>." },
          { title: "Simpan hasil", body: "Cache respons per key." },
        ],
      },
    },
    {
      role: "point",
      counter: "06 / 07",
      eyebrow: "DAMPAK",
      headline: "Kurangi error dobel",
      accentWord: "dobel",
      body: "Efek nyata di produksi setelah endpoint dibuat idempotent.",
      mockup: { type: "bigstat", number: "0", unit: "dobel", caption: "Charge ganda hilang saat retry." },
    },
    {
      role: "outro",
      eyebrow: "KESIMPULAN",
      headline: "Bikin retry aman",
      accentWord: "aman",
      body: "Idempotency = request sama, hasil tetap satu.",
      cta: { strong: "Simpan & bagikan", sub: "Backend & dev-education tiap minggu di @vourdev." },
    },
  ],
```

Also update the `title`/`caption`/`hashtags` header if needed to stay coherent (title `"Idempotency di API — Retry yang Aman"` is fine); leave them otherwise unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/ds/sample.test.ts`
Expected: PASS.

- [ ] **Step 5: Enrich the plan prompt (icon allowlist + variety + intro examples)**

In `lib/ai/prompts.ts`:

(a) In `planSystem`, replace every free-form icon placeholder — `"<lucide:slug>"` in the `card` and `callout` mockup descriptions, and `lucide:<icon-slug>` anywhere — with an instruction to pick from the allowlist. Add this block immediately before `STRICT DESIGN & COPY BUDGET RULES:` in `planSystem`:

```
ICON RULES:
- Every icon MUST be one of these exact slugs (no "lucide:" prefix needed, but allowed):
  terminal, server, database, key, shield-check, lock, git-branch, code, cpu,
  network, cloud, zap, repeat, arrow-right, alert-triangle, check-circle,
  x-circle, circle-alert, sparkles, layers, box, workflow, timer, gauge, bug,
  wrench, rocket, book-open, lightbulb, target, trending-up, file-code, braces,
  webhook, refresh-cw, folder.
- NEVER invent an icon name. If unsure, use "sparkles".

VARIETY EXAMPLE (a good, non-monotone deck — mirror this diversity, not the copy):
- cover (text-only, no hook): eyebrow "AI 101", headline "istilah AI yang wajib lo tau"
  (accentWord "tau"), lede "biar lo gak cuma nge-prompt doang tapi ngerti cara kerjanya."
- point → card (icon "book-open", tone "peach")
- point → terminal (a 4-line snippet)
- point → comparison (bad vs good)
- point → steps (3 steps)
- point → bigstat (one metric)
- outro → cta { strong: "Simpan & bagikan" }
Use ≥3 distinct mockup types and rotate tone colors across slides.
```

(b) In `planSystem`, the `"cover"` role description currently only documents the device hook. Add a sentence making the text-only intro first-class:

Find the `"cover"` role line and append after its `hook is REQUIRED …` sentence:

```
    The cover hook is OPTIONAL — a text-only cover (eyebrow + headline + lede, no hook)
    is a first-class, well-proportioned intro. Omit "hook" for a clean editorial intro;
    include a "device" hook only when a code/UI scene genuinely strengthens the opener.
```

> Note: this contradicts the current wording "hook is REQUIRED". Change that phrase to "hook is OPTIONAL" in the same sentence so the prompt is internally consistent.

(c) In `briefSystem`, under `# Slide 1 — Cover`, add an example intro after the `## Description` guidance:

```
### Example text-only cover (no mockup needed, still looks proportional)
Eyebrow: ISTILAH AI
Headline: istilah AI yang wajib lo **tau**
Description: biar lo gak cuma nge-prompt doang tapi ngerti cara kerjanya.
```

And in `briefSystem`'s `## Visual Direction` icon line, replace the free-form
`lucide:<icon-slug, e.g. …>` with: `Icon: <one slug from the allowlist: key, shield-check, terminal, alert-triangle, layers, database, book-open, lightbulb, …>`.

- [ ] **Step 6: Update the prompt test if it asserts on content**

Run: `npm test -- test/ai/prompts.test.ts`
If it fails only because it asserted on removed placeholder text, update those
assertions to match the new copy (e.g. assert `planSystem` contains
`"ICON RULES"` and `"sparkles"`). If it passes, leave it.
Expected (after any fix): PASS.

- [ ] **Step 7: Run the whole suite**

Run: `npm test`
Expected: PASS (all files).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/ds/sample.ts lib/ai/prompts.ts test/ds/sample.test.ts test/ai/prompts.test.ts
git commit -m "feat(ai): allowlisted icons + varied few-shot + text-intro examples"
```

---

## Final Verification

- [ ] `npm test` — all green.
- [ ] `npx tsc --noEmit` — no type errors.
- [ ] `npm run lint` — clean.
- [ ] Manual: `npm run dev` → `/create` → generate a deck → confirm icons show in preview AND in the exported PNG, with varied mockups and a proportional text intro. (Optional but recommended: toggle the network off in devtools and re-export to prove no CDN dependency.)

## Self-Review Notes (author)

- **Spec coverage:** A (icons) → Tasks 1–5; B (variety) → Task 7; C (intro) → Task 6; D (fonts unchanged / tests) → tests folded into each task. All spec sections mapped.
- **Deviation from spec:** spec said edit `carousel-css.ts` for `.cover-editorial`; plan instead adds `carousel-css-extra.ts` to honor that file's DO-NOT-EDIT header, and only edits the one dead `iconify-icon` selector there. Same outcome, cleaner.
- **Type consistency:** `normalizeIcon`/`renderIcon`/`ICON_SLUGS`/`ICON_SVGS`/`IconSlug`/`iconField` used identically across Tasks 1–4.
