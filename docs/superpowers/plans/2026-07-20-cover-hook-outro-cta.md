# Cover Device-Frame Hook + Outro CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the carousel cover an automatic on-brand visual hook and guarantee every outro closes with a CTA.

**Architecture:** All work lives in `lib/ds/*` (schema, templates, renderer, CSS, a new sanitizer) and `lib/ai/prompts.ts`. The cover gains an optional discriminated-union `hook` (synthetic `device` window, sanitized `custom` HTML, plus a reserved Phase-2 `image` kind); when present, the cover renders in a compact layout. The outro gains an optional `eyebrow` and a required `cta` block, restoring the reference bundle's `.highlight` call-to-action. No wizard/UI changes in this phase.

**Tech Stack:** TypeScript, Zod (schema), Vitest (tests), a hand-rolled `{{slot}}` template filler (`lib/ds/fill.ts`).

## Global Constraints

- Canvas is fixed 1080×1350 — copy/hook must not overflow. Copied verbatim from spec.
- Backward compatibility: a cover with no `hook` and the existing full-hero layout must render byte-identically to today; only the presence of `hook` switches to compact.
- Template filler semantics (`lib/ds/fill.ts`): `{{#key}}…{{/key}}` keeps its inner text only when `vars[key]` is truthy; `{{key}}` is replaced with the **HTML-escaped** value. Raw (unescaped) HTML is injected only by `String.replace` of an ALL-CAPS sentinel, never through `fillTemplate`.
- Headline carries exactly one accent word wrapped in `<span class="a">`; `accentWord` must appear verbatim in the headline (existing `splitHeadline` handles the split).
- Compact/mockup slides use `h1.compact` (88px, already defined in `carousel-css.ts:40`). The full-hero cover uses `h1.hero` (128px).
- Copy budgets (Zod `.max`): cover eyebrow ≤40, headline ≤90, lede ≤140; device hook line text ≤52, 1–6 lines; custom html ≤4000; outro eyebrow ≤40, headline ≤90, body ≤160, cta.strong ≤60, cta.sub ≤90.
- Test runner: `npm test` (== `vitest run`). Tests live under `test/`, import app code via the `@/` alias (e.g. `@/lib/ds/schema`).

---

### Task 1: Outro CTA — schema + fixtures

Adds a required `cta` (and optional `eyebrow`) to the outro slide, then updates every existing outro fixture so the suite still compiles.

**Files:**
- Modify: `lib/ds/schema.ts` (outroSlide, ~lines 105-110)
- Modify: `lib/ds/sample.ts` (outro slide, lines 29-34)
- Modify: `test/ds/schema.test.ts` (outro fixtures, lines 11 and 94)
- Modify: `test/ds/assemble.test.ts` (outro fixture, line 11)
- Modify: `test/ds/render-slide.test.ts` (outro fixture, line 130)

**Interfaces:**
- Produces: `outroSlide` shape `{ role:"outro", eyebrow?:string, headline:string, accentWord?:string, body?:string, cta:{ strong:string, sub?:string } }`. Later tasks (render, prompts) rely on `cta.strong` / `cta.sub` and `eyebrow`.

- [ ] **Step 1: Write the failing test**

Add to `test/ds/schema.test.ts` inside `describe("slidePlanSchema", …)`:

```ts
  it("accepts an outro with a cta", () => {
    const plan = {
      ...valid,
      slides: [
        { role: "cover", eyebrow: "E", headline: "H", accentWord: "H" },
        { role: "outro", headline: "Follow @vourdev", accentWord: "@vourdev",
          cta: { strong: "Simpan & bagikan", sub: "Biar nggak lupa." } },
      ],
    };
    expect(slidePlanSchema.parse(plan).slides).toHaveLength(2);
  });

  it("rejects an outro missing its cta", () => {
    const bad = { ...valid, slides: [{ role: "outro", headline: "No cta here" }] };
    expect(() => slidePlanSchema.parse(bad)).toThrow();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/schema.test.ts`
Expected: FAIL — "accepts an outro with a cta" throws (unknown key `cta`) and/or "rejects an outro missing its cta" does not throw (cta not yet required).

- [ ] **Step 3: Update the outro schema**

In `lib/ds/schema.ts`, replace the `outroSlide` definition (currently lines 105-110):

```ts
const outroSlide = z.object({
  role: z.literal("outro"),
  eyebrow: z.string().max(40).optional(),
  headline: z.string().max(90),
  accentWord: z.string().optional(),
  body: z.string().max(160).optional(),
  cta: z.object({
    strong: z.string().max(60),
    sub: z.string().max(90).optional(),
  }),
});
```

- [ ] **Step 4: Update the four broken outro fixtures**

`lib/ds/sample.ts` — replace the outro slide (lines 29-34) with:

```ts
    {
      role: "outro",
      headline: "Follow @vourdev",
      accentWord: "@vourdev",
      body: "Konten backend tiap minggu.",
      cta: {
        strong: "Follow @vourdev",
        sub: "Backend & dev-education tiap minggu.",
      },
    },
```

`test/ds/schema.test.ts` — the outro in the top-level `valid` fixture (line 11) becomes:

```ts
    { role: "outro", headline: "Follow @vourdev", cta: { strong: "Follow @vourdev" } },
```

and the outro on line 94 (inside the "rejects …" fixture) becomes:

```ts
        { role: "outro", headline: "Done", cta: { strong: "Save it" } },
```

`test/ds/assemble.test.ts` — the outro on line 11 becomes:

```ts
    { role: "outro", headline: "Follow", cta: { strong: "Follow @vourdev" } },
```

`test/ds/render-slide.test.ts` — the outro on line 130 becomes:

```ts
    const html = renderSlide({ role: "outro", headline: "<script>x", cta: { strong: "Save" } });
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- test/ds`
Expected: PASS (all `test/ds/*` files green, including the two new schema tests).

- [ ] **Step 6: Commit**

```bash
git add lib/ds/schema.ts lib/ds/sample.ts test/ds/schema.test.ts test/ds/assemble.test.ts test/ds/render-slide.test.ts
git commit -m "feat: require a cta block on outro slides"
```

---

### Task 2: Outro CTA — template + render

Restores the bundle `.highlight` CTA block (and optional eyebrow) to the outro markup and wires the new fields through the renderer. The `.highlight .strong/.sub` CSS already exists (`carousel-css.ts:94-101`).

**Files:**
- Modify: `lib/ds/templates/outro.ts` (whole file)
- Modify: `lib/ds/render-slide.ts` (the `case "outro"` block, ~lines 172-177)
- Test: `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: outro slide shape from Task 1 (`eyebrow?`, `cta.strong`, `cta.sub?`).
- Produces: outro HTML containing `<div class="highlight">` with `.strong` (always) and `.sub` (only when `cta.sub` present).

- [ ] **Step 1: Write the failing test**

Add to `test/ds/render-slide.test.ts` inside `describe("renderSlide", …)`:

```ts
  it("renders an outro CTA highlight with strong + sub", () => {
    const html = renderSlide({
      role: "outro", eyebrow: "KESIMPULAN", headline: "Mulai sekarang",
      accentWord: "sekarang", body: "Ringkas.",
      cta: { strong: "Simpan & bagikan", sub: "Biar gampang dicari lagi." },
    });
    expect(html).toContain('class="highlight');
    expect(html).toContain('class="strong"');
    expect(html).toContain("Simpan &amp; bagikan");
    expect(html).toContain('class="sub"');
    expect(html).toContain("Biar gampang dicari lagi.");
    expect(html).toContain("KESIMPULAN");
  });

  it("omits the CTA sub-line when not provided", () => {
    const html = renderSlide({ role: "outro", headline: "Done", cta: { strong: "Follow" } });
    expect(html).toContain('class="strong"');
    expect(html).not.toContain('class="sub"');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/render-slide.test.ts`
Expected: FAIL — output has no `class="highlight"` (template not yet updated).

- [ ] **Step 3: Update the outro template**

Replace the whole body of `lib/ds/templates/outro.ts` with:

```ts
// Verbatim <section> markup for the outro role, copied from
// "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" (§ "SLIDE · OUTRO").
// Restores the bundle's counter/eyebrow + .highlight CTA block (strong + sub);
// every {{slot}} here maps to a var renderSlide produces.
export const outroTemplate = String.raw`<section data-screen-label="Outro">
  {{#eyebrow}}
  <div class="eyebrow mt-64">{{eyebrow}}</div>
  {{/eyebrow}}
  <h1 class="mt-24">{{headlinePre}}<span class="a">{{accentWord}}</span>{{headlinePost}}</h1>
  {{#body}}
  <p class="body-text mt-32">
    {{body}}
  </p>
  {{/body}}

  <div class="highlight mt-40">
    <div class="strong">{{ctaStrong}}</div>
    {{#ctaSub}}<div class="sub">{{ctaSub}}</div>{{/ctaSub}}
  </div>

  <div class="brand-row" style="margin-top:auto; padding-top:32px;">
    <div class="brand-disc">
      <img src="{{brand}}" alt="@vourdev">
    </div>
    <span class="brand-handle">@vourdev</span>
  </div>
</section>`;
```

- [ ] **Step 4: Update the outro renderer**

In `lib/ds/render-slide.ts`, replace the `case "outro"` block (~lines 172-177) with:

```ts
    case "outro": {
      const cta = slide.cta ?? { strong: "" };
      return fillTemplate(outroTemplate, {
        brand,
        eyebrow: slide.eyebrow ?? "",
        ...splitHeadline(slide.headline, slide.accentWord),
        body: slide.body ?? "",
        ctaStrong: cta.strong,
        ctaSub: cta.sub ?? "",
      });
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- test/ds/render-slide.test.ts`
Expected: PASS (both new outro tests green; the existing escaping test still passes).

- [ ] **Step 6: Commit**

```bash
git add lib/ds/templates/outro.ts lib/ds/render-slide.ts test/ds/render-slide.test.ts
git commit -m "feat: render the outro CTA highlight block"
```

---

### Task 3: Cover hook — schema

Adds the optional `hook` discriminated union to the cover slide. `hook` is optional, so no existing cover fixture breaks.

**Files:**
- Modify: `lib/ds/schema.ts` (add union above `coverSlide`; add `hook` field to `coverSlide`)
- Test: `test/ds/schema.test.ts`

**Interfaces:**
- Produces: exported type `CoverHook = z.infer<typeof coverHook>` and a `hook?: CoverHook` field on the cover slide. Later tasks discriminate on `hook.kind` (`"device" | "image" | "custom"`).
  - device: `{ kind:"device", chrome:"browser"|"terminal", label?:string, lines: {text:string, style:"plain"|"key"|"val"|"kw"|"cmt"|"num"}[] }` (1–6 lines)
  - image: `{ kind:"image", src:string, frame:"browser"|"phone"|"plain", label?:string }`
  - custom: `{ kind:"custom", html:string }`

- [ ] **Step 1: Write the failing test**

Add a new block to `test/ds/schema.test.ts`:

```ts
import { slidePlanSchema, mockupSchema, coverHookSchema } from "@/lib/ds/schema";

describe("coverHookSchema", () => {
  it("accepts a device hook", () => {
    const h = coverHookSchema.parse({
      kind: "device", chrome: "browser", label: "app.tsx",
      lines: [{ text: "const t = decode(jwt)", style: "kw" }],
    });
    expect(h.kind).toBe("device");
  });
  it("accepts a custom hook", () => {
    const h = coverHookSchema.parse({ kind: "custom", html: "<div>hi</div>" });
    expect(h.kind).toBe("custom");
  });
  it("rejects a device hook with zero lines", () => {
    expect(() => coverHookSchema.parse({ kind: "device", chrome: "browser", lines: [] })).toThrow();
  });
  it("rejects a device hook with more than six lines", () => {
    const lines = Array.from({ length: 7 }, () => ({ text: "x", style: "plain" }));
    expect(() => coverHookSchema.parse({ kind: "device", chrome: "terminal", lines })).toThrow();
  });
});
```

> Note: update the existing top import line in this file to include `coverHookSchema` (shown above).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/schema.test.ts`
Expected: FAIL — `coverHookSchema` is not exported (import error / undefined).

- [ ] **Step 3: Add the cover hook schema**

In `lib/ds/schema.ts`, add just above `const coverSlide = …` (currently line 77):

```ts
/* ── Cover hook (intro scroll-stopper) ────────────────────────── */

const coverHookDevice = z.object({
  kind: z.literal("device"),
  chrome: z.enum(["browser", "terminal"]).default("browser"),
  label: z.string().max(40).optional(),
  lines: z
    .array(
      z.object({
        text: z.string().max(52),
        style: z.enum(["plain", "key", "val", "kw", "cmt", "num"]).default("plain"),
      })
    )
    .min(1)
    .max(6),
});

// Reserved for Phase 2 (wizard attach-screenshot). Not emitted by the wizard yet.
const coverHookImage = z.object({
  kind: z.literal("image"),
  src: z.string(),
  frame: z.enum(["browser", "phone", "plain"]).default("browser"),
  label: z.string().max(40).optional(),
});

const coverHookCustom = z.object({
  kind: z.literal("custom"),
  html: z.string().max(4000),
});

export const coverHookSchema = z.discriminatedUnion("kind", [
  coverHookDevice,
  coverHookImage,
  coverHookCustom,
]);

export type CoverHook = z.infer<typeof coverHookSchema>;
```

Then add the `hook` field to `coverSlide` (currently lines 77-83):

```ts
const coverSlide = z.object({
  role: z.literal("cover"),
  eyebrow: z.string().max(40),
  headline: z.string().max(90),
  accentWord: z.string().optional(),
  lede: z.string().max(140).optional(),
  hook: coverHookSchema.optional(),
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- test/ds/schema.test.ts`
Expected: PASS (all four coverHook tests green; existing tests unaffected).

- [ ] **Step 5: Commit**

```bash
git add lib/ds/schema.ts test/ds/schema.test.ts
git commit -m "feat: add optional cover hook schema (device/image/custom)"
```

---

### Task 4: Custom-HTML sanitizer

A small allowlist sanitizer used to clean the `custom` hook HTML before it is injected raw into the cover.

**Files:**
- Create: `lib/ds/sanitize.ts`
- Test: `test/ds/sanitize.test.ts`

**Interfaces:**
- Produces: `sanitizeHookHtml(html: string): string` — removes `<script>`/`<style>` blocks, inline `on*=` event-handler attributes, and `javascript:` / `data:text/html` URLs; returns otherwise-unchanged markup.

- [ ] **Step 1: Write the failing test**

Create `test/ds/sanitize.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sanitizeHookHtml } from "@/lib/ds/sanitize";

describe("sanitizeHookHtml", () => {
  it("strips <script> blocks", () => {
    const out = sanitizeHookHtml('<div>ok</div><script>alert(1)</script>');
    expect(out).toContain("<div>ok</div>");
    expect(out).not.toContain("alert(1)");
    expect(out.toLowerCase()).not.toContain("<script");
  });
  it("strips inline event handlers", () => {
    const out = sanitizeHookHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
    expect(out).toContain('src="x"');
  });
  it("strips javascript: urls", () => {
    const out = sanitizeHookHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });
  it("keeps benign styled markup", () => {
    const html = '<div class="hook" style="color:red"><span>hi</span></div>';
    expect(sanitizeHookHtml(html)).toBe(html);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/sanitize.test.ts`
Expected: FAIL — module `@/lib/ds/sanitize` not found.

- [ ] **Step 3: Implement the sanitizer**

Create `lib/ds/sanitize.ts`:

```ts
// Minimal allowlist sanitizer for the cover `custom` hook HTML.
// Output is screenshot-captured on the user's own device, so the blast radius
// is limited; this is defense-in-depth, not a full HTML security boundary.
export function sanitizeHookHtml(html: string): string {
  return html
    // Remove <script>…</script> and <style>…</style> entirely.
    .replace(/<\s*(script|style)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    // Remove any dangling opening/closing script|style tags.
    .replace(/<\s*\/?\s*(script|style)\b[^>]*>/gi, "")
    // Remove inline event-handler attributes: on*="…" | on*='…' | on*=word
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Neutralize javascript: and data:text/html URLs in href/src.
    .replace(/(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*/gi, '$1=$2#')
    .replace(/(href|src)\s*=\s*("|')?\s*data:text\/html[^"'>\s]*/gi, '$1=$2#');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- test/ds/sanitize.test.ts`
Expected: PASS (all four tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/ds/sanitize.ts test/ds/sanitize.test.ts
git commit -m "feat: add allowlist sanitizer for custom cover hook html"
```

---

### Task 5: Device hook template + renderer

The synthetic window frame for `kind:"device"`, reusing the existing `.terminal` chrome. Adds a `.urlbar` pill for `chrome:"browser"`.

**Files:**
- Create: `lib/ds/templates/device.ts`
- Modify: `lib/ds/render-slide.ts` (add `renderDeviceHook` helper near the other mockup renderers)
- Modify: `lib/ds/carousel-css.ts` (add `.urlbar` rule after the `.terminal-bar .title` rule, ~line 267)
- Test: `test/ds/render-slide.test.ts` (unit-test the helper via a temporary export — see Step 1 note)

**Interfaces:**
- Consumes: device hook shape from Task 3.
- Produces: `renderDeviceHook(h: Extract<CoverHook,{kind:"device"}>): string` returning a `.diag-wrap > .terminal` fragment. For `chrome:"browser"` the bar shows `<span class="urlbar">label</span>`; for `chrome:"terminal"` it shows `<span class="title">label</span>`. Body lines mirror the terminal renderer (styled `<span>` per non-plain line, `\n`-joined, raw-injected).

- [ ] **Step 1: Write the failing test**

Add to `test/ds/render-slide.test.ts`. The helper is exported directly from `render-slide.ts` (Step 3), so these test it in isolation and pass within this task — the cover render wiring lands in Task 6:

```ts
import { renderSlide, renderDeviceHook } from "@/lib/ds/render-slide";

describe("renderDeviceHook", () => {
  it("renders browser chrome with a url pill and styled lines", () => {
    const html = renderDeviceHook({
      kind: "device", chrome: "browser", label: "app.vourdev.com",
      lines: [
        { text: "// readable by anyone", style: "cmt" },
        { text: "decode(jwt)", style: "kw" },
      ],
    });
    expect(html).toContain('class="diag-wrap');
    expect(html).toContain('class="urlbar"');
    expect(html).toContain("app.vourdev.com");
    expect(html).toContain('class="cmt"');
    expect(html).toContain('class="kw"');
  });
  it("renders terminal chrome with a filename title", () => {
    const html = renderDeviceHook({
      kind: "device", chrome: "terminal", label: "jwt.ts",
      lines: [{ text: "const t = 1", style: "plain" }],
    });
    expect(html).toContain('class="title"');
    expect(html).toContain("jwt.ts");
    expect(html).not.toContain('class="urlbar"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/render-slide.test.ts`
Expected: FAIL — `renderDeviceHook` is not exported.

- [ ] **Step 3: Create the device template and renderer**

Create `lib/ds/templates/device.ts`:

```ts
// Synthetic device/window frame for the cover hook. Reuses the terminal chrome
// (.terminal, .terminal-bar, mac dots). BAR_LABEL_INJECT carries either a
// .urlbar pill (browser) or a .title filename (terminal); DEVICE_LINES_INJECT
// carries the syntax-styled body lines. Both are raw-injected (not fillTemplate).
export const deviceTemplate = String.raw`<div class="diag-wrap mt-40">
    <div class="terminal">
      <div class="terminal-bar">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        BAR_LABEL_INJECT
      </div>
<div class="terminal-body">DEVICE_LINES_INJECT</div>
    </div>
  </div>`;
```

In `lib/ds/render-slide.ts`, add the import at the top (next to the other template imports):

```ts
import { deviceTemplate } from "@/lib/ds/templates/device";
```

and add this exported helper next to the other mockup renderers (after `renderBigstatMockup`, before `renderCardMockup`):

```ts
export function renderDeviceHook(h: Extract<CoverHook, { kind: "device" }>): string {
  const bodyLines = h.lines
    .map((l) => {
      const escaped = escapeHtml(l.text);
      return l.style && l.style !== "plain" ? `<span class="${l.style}">${escaped}</span>` : escaped;
    })
    .join("\n");
  const labelHtml = h.label
    ? h.chrome === "browser"
      ? `<span class="urlbar">${escapeHtml(h.label)}</span>`
      : `<span class="title">${escapeHtml(h.label)}</span>`
    : "";
  return deviceTemplate
    .replace("BAR_LABEL_INJECT", labelHtml)
    .replace("DEVICE_LINES_INJECT", bodyLines);
}
```

Add `CoverHook` to the type import at the top of the file:

```ts
import type { Slide, Mockup, CoverHook } from "@/lib/ds/schema";
```

- [ ] **Step 4: Add the `.urlbar` CSS**

In `lib/ds/carousel-css.ts`, immediately after the `.terminal-bar .title` rule (line 267) add:

```ts
  .terminal-bar .urlbar { margin-left: 16px; flex: 1; background: rgba(255,255,255,0.10); color: rgba(255,255,255,0.75); font-family: 'JetBrains Mono'; font-size: 20px; padding: 8px 18px; border-radius: 999px; text-align: center; }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- test/ds/render-slide.test.ts`
Expected: PASS (both `renderDeviceHook` tests green).

- [ ] **Step 6: Commit**

```bash
git add lib/ds/templates/device.ts lib/ds/render-slide.ts lib/ds/carousel-css.ts test/ds/render-slide.test.ts
git commit -m "feat: add synthetic device-frame cover hook renderer"
```

---

### Task 6: Compact cover template + render branch

Wires the hook into the cover: a compact cover layout when `hook` is present, dispatching to the device renderer, the sanitizer (custom), or a minimal image renderer. No-hook covers stay on the existing full-hero template.

**Files:**
- Create: `lib/ds/templates/cover-compact.ts`
- Modify: `lib/ds/render-slide.ts` (imports; `renderImageHook` helper; `case "cover"` block, ~lines 127-133)
- Test: `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `renderDeviceHook` (Task 5), `sanitizeHookHtml` (Task 4), cover `hook` (Task 3).
- Produces: cover HTML — full-hero (`h1.hero`, no `HOOK_INJECT`) when `hook` is absent; compact (`h1.compact` + hook fragment) when present.

- [ ] **Step 1: Write the failing test**

Add to `test/ds/render-slide.test.ts` inside `describe("renderSlide", …)`:

```ts
  it("renders a full-hero cover (no hook) with hero headline", () => {
    const html = renderSlide({ role: "cover", eyebrow: "BACKEND", headline: "Idempotency", accentWord: "Idempotency" });
    expect(html).toContain("hero");
    expect(html).not.toContain("HOOK_INJECT");
    expect(html).toContain("Geser");
  });

  it("renders a compact cover with a device hook", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "MISKONSEPSI", headline: "JWT bukan enkripsi", accentWord: "enkripsi",
      hook: { kind: "device", chrome: "browser", label: "app.tsx",
        lines: [{ text: "decode(jwt)", style: "kw" }] },
    });
    expect(html).toContain('h1 class="compact');
    expect(html).toContain('class="urlbar"');
    expect(html).not.toContain("HOOK_INJECT");
    expect(html).toContain("MISKONSEPSI");
  });

  it("sanitizes a custom cover hook", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "E", headline: "H", accentWord: "H",
      hook: { kind: "custom", html: '<div class="x">ok</div><script>alert(1)</script>' },
    });
    expect(html).toContain('<div class="x">ok</div>');
    expect(html).not.toContain("alert(1)");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/render-slide.test.ts`
Expected: FAIL — cover with a hook still renders the full-hero template (no `h1 class="compact"`, no `urlbar`).

- [ ] **Step 3: Create the compact cover template**

Create `lib/ds/templates/cover-compact.ts`:

```ts
// Compact cover used when the cover carries a `hook`. Headline drops to
// h1.compact (88px) so the hook fits the fixed 1080×1350 canvas. HOOK_INJECT is
// replaced with the raw hook fragment (device/custom/image); each hook renderer
// supplies its own container (.diag-wrap or a plate).
export const coverCompactTemplate = String.raw`<section data-screen-label="01 · Cover">
  <div class="brand-row">
    <div class="brand-disc">
      <img src="{{brand}}" alt="@vourdev">
    </div>
    <span class="brand-handle">@vourdev</span>
  </div>

  <div class="eyebrow mt-64">{{eyebrow}}</div>
  <h1 class="compact mt-24">{{headlinePre}}<span class="a">{{accentWord}}</span>{{headlinePost}}</h1>
  {{#lede}}
  <p class="lede mt-24">
    {{lede}}
  </p>
  {{/lede}}

  HOOK_INJECT

  <div class="geser">Geser →</div>
</section>`;
```

- [ ] **Step 4: Wire the cover render branch**

In `lib/ds/render-slide.ts`, add the import (next to the other template imports):

```ts
import { coverCompactTemplate } from "@/lib/ds/templates/cover-compact";
import { sanitizeHookHtml } from "@/lib/ds/sanitize";
```

Add a minimal image renderer next to `renderDeviceHook`:

```ts
// Phase-2 refinement pending (ImagePlate styling). Minimal, escaped, safe today.
function renderImageHook(h: Extract<CoverHook, { kind: "image" }>): string {
  const src = escapeHtml(h.src);
  return `<div class="diag-wrap mt-40"><img src="${src}" alt="" style="max-width:100%; border-radius:20px;"></div>`;
}
```

Replace the `case "cover"` block (currently lines 127-133) with:

```ts
    case "cover": {
      if (!slide.hook) {
        return fillTemplate(coverTemplate, {
          brand,
          eyebrow: slide.eyebrow,
          ...splitHeadline(slide.headline, slide.accentWord),
          lede: slide.lede ?? "",
        });
      }
      const h = slide.hook;
      let fragment = "";
      if (h.kind === "device") fragment = renderDeviceHook(h);
      else if (h.kind === "custom") fragment = sanitizeHookHtml(h.html);
      else fragment = renderImageHook(h);
      const base = fillTemplate(coverCompactTemplate, {
        brand,
        eyebrow: slide.eyebrow,
        ...splitHeadline(slide.headline, slide.accentWord),
        lede: slide.lede ?? "",
        hook: "1",
      });
      return base.replace("HOOK_INJECT", fragment);
    }
```

- [ ] **Step 5: Run the full ds suite to verify it passes**

Run: `npm test -- test/ds`
Expected: PASS (three new cover tests green; all prior `test/ds/*` still green).

- [ ] **Step 6: Commit**

```bash
git add lib/ds/templates/cover-compact.ts lib/ds/render-slide.ts test/ds/render-slide.test.ts
git commit -m "feat: render a compact cover with a hook (device/custom/image)"
```

---

### Task 7: Prompts — hook + CTA generation

Teaches the AI to always author a synthetic device hook on the cover and a CTA on the outro, and to edit both on revise.

**Files:**
- Modify: `lib/ai/prompts.ts` (`briefSystem`, `planSystem`, `reviseSystem`)
- Test: `test/ai/prompts.test.ts` (create)

**Interfaces:**
- Consumes: the schema shapes from Tasks 1 and 3 (the prompt text must describe fields exactly as named: cover `hook.kind:"device"` with `chrome`/`label`/`lines`; outro `cta.strong`/`cta.sub`).

- [ ] **Step 1: Write the failing test**

Create `test/ai/prompts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { planSystem, reviseSystem } from "@/lib/ai/prompts";

describe("planSystem", () => {
  it("documents the cover device hook", () => {
    expect(planSystem).toMatch(/hook/);
    expect(planSystem).toMatch(/device/);
    expect(planSystem).toMatch(/chrome/);
  });
  it("requires an outro cta", () => {
    expect(planSystem).toMatch(/cta/);
    expect(planSystem.toLowerCase()).toMatch(/call.?to.?action|cta/);
  });
});

describe("reviseSystem", () => {
  it("covers editing the hook and the cta", () => {
    expect(reviseSystem).toMatch(/hook/);
    expect(reviseSystem).toMatch(/cta/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ai/prompts.test.ts`
Expected: FAIL — `planSystem` does not yet mention `hook`/`device`/`cta`.

- [ ] **Step 3: Update `planSystem`**

In `lib/ai/prompts.ts`, in the `planSystem` role list, change the cover and outro lines and add mockup/CTA guidance. Replace the three role bullet lines (currently lines 135-137) with:

```
- "cover": { eyebrow, headline, accentWord?, lede?, hook } — hook is REQUIRED and MUST be a synthetic device frame:
    hook: { kind: "device", chrome: "browser"|"terminal", label?: "app.tsx"|"app.vourdev.com", lines: [{ text, style: "plain"|"key"|"val"|"kw"|"cmt"|"num" }] }
    → 1–6 short lines (≤ 52 chars each) of on-topic code/UI that stops the scroll. Use "browser" chrome for app/URL scenes, "terminal" for code/CLI.
- "point": { counter (e.g. "02 / 05"), eyebrow, headline, accentWord?, body, mockup: <one of the types below> }
- "outro": { eyebrow?, headline, accentWord?, body?, cta } — cta is REQUIRED:
    cta: { strong: "<the action, e.g. Simpan & bagikan>", sub?: "<why/how, 1 short line>" }
    → strong MUST be a concrete call-to-action (save / share / follow / try). Never omit the cta.
```

- [ ] **Step 4: Update `briefSystem` and `reviseSystem`**

In `briefSystem`, add a hook direction to the Cover section. After the cover `## Description` block (line 26), add:

```
## Hook Mockup
<Describe a synthetic device frame for the cover: browser or terminal chrome, an optional label (URL or filename), and 1-6 short on-topic lines that stop the scroll.>
```

In `reviseSystem`, extend the target-slide rules. After item 1's `"cover"` bullet (line 188), add a sub-bullet:

```
   - Cover hook edits: the cover carries a `hook` (kind "device": chrome/label/lines, or kind "custom": html). Update these when asked to change the intro visual.
```

And replace item 4 (outro format, lines 200-202) with:

```
4. OUTRO SLIDE FORMAT:
   - Role "outro" format: { "role": "outro", "eyebrow"?: "...", "headline": "...", "accentWord": "...", "body"?: "...", "cta": { "strong": "...", "sub"?: "..." } }.
   - The "cta" is REQUIRED and must stay a concrete call-to-action. If the user changes the outro, keep (or improve) a valid cta.
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- test/ai/prompts.test.ts`
Expected: PASS (all prompt assertions green).

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS (entire suite green).

- [ ] **Step 7: Commit**

```bash
git add lib/ai/prompts.ts test/ai/prompts.test.ts
git commit -m "feat: prompt AI to author cover hooks and outro CTAs"
```

---

## Self-Review

**Spec coverage:**
- A1 cover hook schema → Task 3. A2 compact layout → Task 6. A3 templates (cover-compact, device) → Tasks 5-6. A4 render branch → Task 6. A5 CSS (compact reuses existing `h1.compact`; `.urlbar` new) → Task 5. A6 prompts → Task 7. Image kind reserved → Task 3 (schema) + Task 6 (minimal renderer).
- B1 outro schema → Task 1. B2 template → Task 2. B3 render → Task 2. B4 prompts → Task 7.
- Security sanitizer → Task 4, applied in Task 6.
- Testing section → each task's TDD steps; `sanitize` and `prompts` get dedicated files.
- Non-goal (upload override / wizard) correctly excluded — no wizard tasks.

**Placeholder scan:** No TBD/TODO; every code step shows full code; no "similar to Task N".

**Type consistency:** `coverHookSchema`/`CoverHook`, `sanitizeHookHtml`, `renderDeviceHook`, `renderImageHook`, `coverCompactTemplate`, `deviceTemplate`, and the outro `cta.strong`/`cta.sub` names are used identically across Tasks 3-7. Sentinels `HOOK_INJECT`, `BAR_LABEL_INJECT`, `DEVICE_LINES_INJECT` match between their templates and renderers.

**Note carried into execution:** making outro `cta` required (Task 1) is why Tasks 1's fixture edits touch five files; do not skip any or the suite won't compile.
