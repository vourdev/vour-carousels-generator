# Cover Device-Frame Hook + Outro CTA — Design

Date: 2026-07-20
Status: Approved (design), ready for implementation plan

## Problem

Two content gaps hurt carousel performance, both caused by the app's slide
schema dropping features that exist in the reference bundle
(`Vour Dev Design System/bundle`):

1. **Intro is not a hook.** The cover renders text only — eyebrow, headline,
   optional lede, `Geser →` ([lib/ds/templates/cover.ts](../../../lib/ds/templates/cover.ts)).
   On a scroll feed the first slide is the hook; a flat text cover gets skipped.
   The bundle stops the scroll with a **device/window mock-screen** as the hero
   visual. The app's cover has no such capability.

2. **Outro has no CTA.** The bundle outro carries a `.highlight` call-to-action
   block (`.strong` action line + `.sub` why/how). The app **deliberately
   dropped it** ([lib/ds/templates/outro.ts](../../../lib/ds/templates/outro.ts)
   header comment) because the outro schema had no slot for it, and the brief's
   outro `Highlight` field is silently lost in the brief→plan translation. Every
   outro ends without asking the viewer to do anything.

Point slides already have a full mockup system (terminal, comparison, steps,
callout, bigstat, card) and are **out of scope**.

## Goals

- Give the cover an automatic, on-brand **visual hook** with zero extra user
  effort (AI authors it), plus an escape hatch for bespoke hooks.
- Guarantee every outro closes with a **CTA**.
- Stay backward compatible: covers/outros without the new fields render exactly
  as today.

## Non-goals (this spec)

- **Upload override (Phase 2).** Letting a user attach a real screenshot that
  renders inside the cover frame requires new wizard UI + data flow. The schema
  reserves `hook.kind:"image"` for it, but it is **not built in Phase 1**. Today
  uploaded images are publish-only (finished PNGs → Cloudinary → Buffer,
  [app/create/wizard.tsx](../../../app/create/wizard.tsx)); no image renders
  inside a slide.
- No changes to point slides, export/capture, or publishing.

## Phasing

- **Phase 1 (this spec):** synthetic `device` hook + sanitized `custom` hatch +
  outro CTA. Entirely within `lib/ds/*` and `lib/ai/prompts.ts` — no wizard
  changes.
- **Phase 2 (later, separate plan):** `image` hook kind + wizard attach-screenshot
  UI wiring the Cloudinary URL into `hook.kind:"image"`.

---

## Feature A — Cover device-frame hook

### A1. Schema (`lib/ds/schema.ts`)

Add an optional `hook` to `coverSlide` as a discriminated union on `kind`:

```ts
const coverHookDevice = z.object({
  kind: z.literal("device"),
  chrome: z.enum(["browser", "terminal"]).default("browser"),
  label: z.string().max(40).optional(),     // URL bar (browser) / filename (terminal)
  lines: z
    .array(z.object({
      text: z.string().max(52),
      style: z.enum(["plain", "key", "val", "kw", "cmt", "num"]).default("plain"),
    }))
    .min(1)
    .max(6),
});

const coverHookImage = z.object({          // Phase 2 — reserved, not rendered by wizard yet
  kind: z.literal("image"),
  src: z.string(),
  frame: z.enum(["browser", "phone", "plain"]).default("browser"),
  label: z.string().max(40).optional(),
});

const coverHookCustom = z.object({
  kind: z.literal("custom"),
  html: z.string().max(4000),              // raw brand-scoped HTML fragment; sanitized at render
});

const coverHook = z.discriminatedUnion("kind", [
  coverHookDevice, coverHookImage, coverHookCustom,
]);

const coverSlide = z.object({
  role: z.literal("cover"),
  eyebrow: z.string().max(40),
  headline: z.string().max(90),
  accentWord: z.string().optional(),
  lede: z.string().max(140).optional(),
  hook: coverHook.optional(),              // NEW
});
```

`hook` is optional → old plans without it validate and render as the current
full-hero cover.

### A2. Layout — compact cover

The current cover uses `h1.hero` (128px). A 128px headline + a device frame
overflows the fixed 1080×1350 canvas. When `hook` is present, render a **compact
cover**:

- Headline uses the compact size (88px), matching the mockup-slide proportion
  contract point slides already follow.
- `lede` is optional and, if present, capped tighter by the prompt.
- The hook sits in a `.diag-wrap { flex:1; min-height:0 }` block below the copy,
  the same container point mockups use, so vertical space distributes correctly.
- `Geser →` stays pinned at the bottom.

When `hook` is absent → the existing full-hero cover template, unchanged.

### A3. Templates (`lib/ds/templates/`)

- **New `cover-compact.ts`** — cover markup with an 88px headline and a
  `MOCKUP_INJECT`-style sentinel (`HOOK_INJECT`) where the hook fragment goes.
  Copied structurally from the existing cover + the bundle mock-screen stack.
- Existing `cover.ts` stays for the no-hook path.
- **New `device.ts`** — window frame reusing the existing terminal chrome
  (`.terminal`, `.terminal-bar`, mac `.dot r/y/g`). `chrome:"terminal"` shows the
  `label` as a mono filename `.title`; `chrome:"browser"` shows `label` as a URL
  pill (`.urlbar`). Body lines rendered like the terminal renderer
  (styled `<span>`s, raw-injected to avoid double-escaping).

### A4. Render (`lib/ds/render-slide.ts`)

`case "cover"`:

```
if (!slide.hook) -> fillTemplate(coverTemplate, ...)          // unchanged path
else:
  base = fillTemplate(coverCompactTemplate, { ...copy, hook: "1" })
  fragment =
    hook.kind === "device" -> renderDeviceHook(hook)
    hook.kind === "custom" -> sanitizeHookHtml(hook.html)
    hook.kind === "image"  -> renderImageHook(hook)           // Phase 2 (guarded / no-op stub in P1)
  return base.replace("HOOK_INJECT", fragment)                 // raw inject, not fillTemplate
```

Reuse the existing pattern where non-card mockups replace a sentinel with raw
HTML ([render-slide.ts](../../../lib/ds/render-slide.ts) `MOCKUP_INJECT`).

### A5. CSS (`lib/ds/carousel-css.ts`)

- Compact-cover headline sizing (88px) scoped to the compact cover.
- `.urlbar` pill styling for `chrome:"browser"` (reuses terminal-bar layout).
- Device chrome otherwise reuses existing `.terminal*` rules — no duplication.
- No ImagePlate CSS in Phase 1 (that's the `image` kind → Phase 2).

### A6. Prompts (`lib/ai/prompts.ts`)

- `planSystem`: document the cover `hook` field and add a rule — **the cover MUST
  carry a synthetic `device` hook** (browser or terminal chrome) as the
  scroll-stopper, with 1–6 short content lines relevant to the topic. Keep the
  compact copy budgets (headline ≤ 7 words; lede optional and short).
- `briefSystem`: cover section instructs a "Hook Mockup" direction so the plan
  step has material to convert.
- `reviseSystem`: add cover-hook editing (change chrome, label, lines; or swap to
  a `custom` hook). Keep accentWord synchronization rules intact.

---

## Feature B — Outro CTA

### B1. Schema (`lib/ds/schema.ts`)

```ts
const outroSlide = z.object({
  role: z.literal("outro"),
  eyebrow: z.string().max(40).optional(),   // NEW — bundle outro closing eyebrow
  headline: z.string().max(90),
  accentWord: z.string().optional(),
  body: z.string().max(160).optional(),
  cta: z.object({                            // NEW — required: every outro closes with a CTA
    strong: z.string().max(60),              // the action, e.g. "Simpan & bagikan"
    sub: z.string().max(90).optional(),      // the why/how
  }),
});
```

`cta` is **required**. Plans are generated fresh each run (stateless), and the
revise flow returns a complete plan, so requiring it forces the AI to always
produce a CTA — the whole point. Any legacy persisted plan lacking `cta` is
regenerated, not migrated.

### B2. Template (`lib/ds/templates/outro.ts`)

Restore the dropped block (CSS already exists at
[carousel-css.ts:94-101](../../../lib/ds/carousel-css.ts)):

```html
<section data-screen-label="Outro">
  {{#eyebrow}}<div class="eyebrow mt-64">{{eyebrow}}</div>{{/eyebrow}}
  <h1 class="mt-24">{{headlinePre}}<span class="a">{{accentWord}}</span>{{headlinePost}}</h1>
  {{#body}}<p class="body-text mt-32">{{body}}</p>{{/body}}

  <div class="highlight mt-40">
    <div class="strong">{{ctaStrong}}</div>
    {{#ctaSub}}<div class="sub">{{ctaSub}}</div>{{/ctaSub}}
  </div>

  <div class="brand-row" style="margin-top:auto; padding-top:32px;">
    <div class="brand-disc"><img src="{{brand}}" alt="@vourdev"></div>
    <span class="brand-handle">@vourdev</span>
  </div>
</section>
```

### B3. Render (`lib/ds/render-slide.ts`)

`case "outro"` passes `eyebrow`, `ctaStrong`, `ctaSub` in addition to the current
fields.

### B4. Prompts

- `planSystem`: outro spec becomes `{ eyebrow?, headline, accentWord?, body?, cta:{strong, sub?} }`
  with a rule that the CTA is mandatory (a concrete action: save / share / follow
  / try).
- `briefSystem`: map the existing outro `Highlight` → `cta`.
- `reviseSystem`: item 4 (outro format) updated to include `cta`.

---

## Security — custom HTML hatch

`hook.kind:"custom"` injects raw author-supplied HTML. Output is rendered
client-side to the user's **own** image (screenshot capture), never served as a
live page to third parties, so the blast radius is the user's own session.
As defense-in-depth, `sanitizeHookHtml(html)` runs before inject and:

- strips `<script>…</script>` and `<style>` that targets outside the fragment,
- strips inline event handlers (`on*=` attributes),
- strips `javascript:` / `data:text/html` URLs,
- allows only presentational tags/attributes (div, span, p, img[src], svg,
  headings, `class`, `style`).

A dedicated small allowlist sanitizer in `lib/ds/sanitize.ts` (no heavy dep).

## Files touched (Phase 1)

| File | Change |
|---|---|
| `lib/ds/schema.ts` | cover `hook` union; outro `eyebrow?` + required `cta` |
| `lib/ds/templates/cover-compact.ts` | NEW — compact cover with `HOOK_INJECT` |
| `lib/ds/templates/device.ts` | NEW — browser/terminal window hook |
| `lib/ds/templates/outro.ts` | restore `.highlight` CTA + optional eyebrow |
| `lib/ds/render-slide.ts` | cover hook branch; outro CTA fields |
| `lib/ds/carousel-css.ts` | compact headline; `.urlbar` pill |
| `lib/ds/sanitize.ts` | NEW — allowlist HTML sanitizer for custom hook |
| `lib/ai/prompts.ts` | plan/brief/revise updates for hook + CTA |

## Testing

- **Schema:** zod accepts each hook kind and a valid outro `cta`; rejects an
  outro missing `cta`; rejects device hook with 0 or >6 lines.
- **Render:** `renderSlide` for cover no-hook (full hero), device hook
  (browser + terminal chrome), custom hook (sanitized). Outro with and without
  `cta.sub`.
- **Sanitizer:** strips `<script>`, `onerror=`, `javascript:` href; preserves a
  benign styled `<div>`.
- **Snapshot:** compact cover vs full cover HTML; outro CTA present.
- Run `vercel:react-best-practices` on any TSX touched (none expected in Phase 1).

## Open questions

None blocking. Phase 2 (upload override) gets its own spec.
