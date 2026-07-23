# Design — DS Variety, Editorial Text Intro & Icon Reliability

Date: 2026-07-23
Status: Approved (design), pending spec review

## Problem

Three user-reported gaps in the carousel design system (`lib/ds`) and the AI
prompt layer (`lib/ai`):

1. **Icons silently disappear** in both the HTML preview and the exported PNG.
2. **Decks look monotone** — the AI under-uses the six mockup types and tends to
   repeat the same card/terminal look.
3. **The intro/cover has no good text-only option.** A pure eyebrow + headline +
   lede intro (the user's example: _"istilah AI yang wajib lo tau / biar lo gak
   cuma nge-prompt doang tapi ngerti cara kerjanya."_) is not proportional on the
   fixed 1080×1350 canvas — the current cover leans on a device-frame hook.

Additional constraint from the user: fonts and icons must stay on the
**editorial / tutor** theme.

## Root Cause — Icons

- `lib/ds/schema.ts` types both icon fields (`card`, `callout`) as
  `icon: z.string()` — free-form. The AI can emit any string, including a
  hallucinated slug or the literal placeholder from the prompt
  (`lucide:<icon-slug>`, `lucide:slug`).
- **Preview** (`lib/ds/assemble.ts:18`) renders icons via the
  `<iconify-icon>` web component, loaded at runtime from the
  `code.iconify.design` CDN — async, network-dependent; an invalid slug or a
  slow/blocked CDN renders nothing.
- **Export** (`lib/export/capture.ts`) pre-fetches
  `https://api.iconify.design/{prefix}/{name}.svg`; a 404 on a bad slug is caught
  and the `<iconify-icon>` is left unresolved, so `inlineIcons` finds no `<svg>`
  and the PNG shows a blank.

Both failure paths share three causes: **no allowlist**, **CDN dependency**, and
**no fallback**.

## Goals

- Icons render identically in preview and PNG, offline, every time.
- Icons and fonts read as a coherent editorial/tutor system.
- The AI produces visually varied decks using all six existing mockups.
- A text-only intro looks balanced and proportional, with the device-hook cover
  still available.

## Non-Goals

- No new mockup component types (variety is solved at the content layer).
- No font change — Sora / Nunito / JetBrains Mono are already inlined
  (`lib/ds/fonts-inline.ts`, 17 committed `@font-face` blocks) and are on-theme.
- No change to the device-hook cover behavior beyond making the text intro a
  first-class sibling.
- No redesign of the publish/export capture flow beyond removing the now-dead
  icon-fetch code.

---

## A. Icon System — self-hosted, allowlisted, CDN-free (the strict rule)

### A1. Codegen (mirrors the committed `fonts-inline.ts` pattern)

New script `scripts/gen-icons.ts`:

- Reads the authentic icon node data for each allowlisted slug from the already
  installed `lucide-react` (v1.24.0), whose per-icon ESM modules export an
  `__iconNode` array of `[tag, attrs]` tuples
  (e.g. `node_modules/lucide-react/dist/esm/icons/terminal.mjs`).
- Wraps each icon's children in the standard lucide SVG envelope:
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">…children…</svg>`.
- **Fails loudly** if any allowlisted slug is missing from `lucide-react` — this
  is what makes the allowlist strict by construction (a typo can never ship as a
  blank icon).
- Writes a committed `lib/ds/icons.generated.ts` exporting
  `ICON_SVGS: Record<string, string>` (slug → raw inline `<svg>` string).
- Wire an `npm run gen:icons` script (alongside any existing font script) so the
  generated file is reproducible; the generated file is committed so no build
  step or runtime dependency is required to render.

### A2. `lib/ds/icons.ts` (public API over the generated map)

```ts
export const ICON_SLUGS = [ /* the ~36 curated slugs, as const */ ] as const;
export type IconSlug = (typeof ICON_SLUGS)[number];

const FALLBACK: IconSlug = "sparkles";

/** Strip a `lucide:` prefix, lowercase, and coerce to a known slug. */
export function normalizeIcon(raw: string): IconSlug;

/** Return the inline <svg> string for a slug, with size + color applied.
    Unknown slug → FALLBACK. Never returns empty. */
export function renderIcon(
  raw: string,
  opts?: { size?: number; color?: string }
): string;
```

- `renderIcon` default `size = 24`, default `color = "#E94B19"` (the brand orange
  the current templates hardcode). It sets `width`/`height` to `size` and `stroke`
  to `color` on the generated SVG.
- `normalizeIcon` handles `"lucide:repeat"`, `"repeat"`, and any hallucinated /
  placeholder value (`"lucide:slug"`, `"lucide:<icon-slug>"`) → all resolve to a
  valid slug or `FALLBACK`.

### A3. Curated allowlist (~36 icons, editorial/tutor line set)

All are real `lucide-react` v1.24 slugs; the codegen validates them.

```
terminal, server, database, key, shield-check, lock, git-branch, code, cpu,
network, cloud, zap, repeat, arrow-right, alert-triangle, check-circle,
x-circle, circle-alert, sparkles, layers, box, workflow, timer, gauge, bug,
wrench, rocket, book-open, lightbulb, target, trending-up, file-code, braces,
webhook, refresh-cw, folder
```

`sparkles` is the guaranteed fallback (already used as the auto-card fallback in
`render-slide.ts`).

Exact slug spellings are validated against the installed `lucide-react` version
at codegen time (it fails loudly on a miss), so any renamed aliases — e.g.
`alert-triangle` → `triangle-alert`, `x-circle` → `circle-x` in newer lucide —
are resolved to the version's real slug during implementation. The set above is
the intended icon *vocabulary*, not a promise of exact strings.

### A4. Schema (`lib/ds/schema.ts`)

Change the icon field in **both** the `card` mockup and the `callout` mockup (and
the legacy `pointSlide.card`): `icon: z.string()` →
`icon: z.string().transform(normalizeIcon)`. Invalid input coerces instead of
throwing; the parsed type narrows to `IconSlug`.

### A5. Templates + render (`lib/ds/templates/*`, `lib/ds/render-slide.ts`)

- `templates/callout.ts` and `templates/point.ts`: replace the
  `<iconify-icon icon="{{calloutIcon}}" …>` / `<iconify-icon icon="{{cardIcon}}" …>`
  tag with an `ICON_INJECT` sentinel (same raw-injection pattern already used for
  `MOCKUP_INJECT` / `HOOK_INJECT`).
- `render-slide.ts`: after `fillTemplate`, replace the sentinel with
  `renderIcon(slug)` using a **function replacer** (consistent with the existing
  `$`-safe replacers in this file) so any `$` in surrounding content can't corrupt
  output.

### A6. Kill the CDN + async race

- `lib/ds/assemble.ts:18` — delete the
  `<script src="https://code.iconify.design/…">` line.
- `lib/export/capture.ts` — delete `preFetchAndReplaceIcons`, the `iconify-icon`
  render-wait block inside `waitForReady`, and `inlineIcons`. Icons are now plain
  `<svg>` already present in the DOM, so `html-to-image` captures them natively.
  Keep the `doc.fonts.ready` wait and the small settle timeout.
- `lib/ds/carousel-css.ts:305` — change the `.mock-lock iconify-icon { … }`
  selector to target `svg`.

**Result:** zero network at preview and export; icons always render; the export
timing logic shrinks substantially.

---

## B. DS Variety — richer few-shot (no new components)

The six mockups (`card`, `terminal`, `comparison`, `steps`, `callout`,
`bigstat`) already exist and the prompt already has a "vary types / ≥3 per 6
slides" rule (`prompts.ts` rules 5–6). The model simply under-uses them. Fix at
the content layer only:

- **Expand `samplePlan` (`lib/ds/sample.ts`)** from 3 slides to a full ~7-slide
  deck: a text-only cover + one slide for each of the six mockups + an outro,
  with rotating `tone` colors. `samplePlan` is both the schema/assemble test
  fixture and the preview seed, so this also makes the default preview varied.
  Every icon it references must be from the allowlist.
- **Add one compact worked example** into `planSystem` (`lib/ai/prompts.ts`)
  showing a short deck with varied mockup types and tone rotation, and reinforce
  the existing anti-monotone rule by pointing at it. Icons in the example must be
  drawn from the allowlist, and the prompt's icon guidance must enumerate the
  allowlist instead of the free-form `lucide:<icon-slug>` placeholder.

---

## C. Text-Only Editorial Intro

- **CSS** (`lib/ds/carousel-css.ts`): add a `.cover-editorial` treatment so the
  **no-hook** cover (`templates/cover.ts`) is vertically balanced on 1080×1350 —
  larger hero type, a centered/anchored content block, and deliberate breathing
  space — proportional with no device frame. The device-hook path
  (`cover-compact.ts`) is unchanged.
- **Prompt examples** (`lib/ai/prompts.ts`, brief + plan): add a text-only intro
  example modeled on the user's:
  - eyebrow: `ISTILAH AI`
  - headline: `istilah AI yang wajib lo **tau**` (accent word `tau`)
  - lede: `biar lo gak cuma nge-prompt doang tapi ngerti cara kerjanya.`
  Make clear the cover `hook` is optional and a text-only intro is a first-class,
  good-looking choice — the device-frame hook remains available.

---

## D. Fonts + Tests

- **Fonts:** no change. Sora / Nunito / JetBrains Mono are already inlined and
  editorial; the new inline SVG icons (2px round lucide line style) match that
  tutor tone.
- **Tests** (mirror the existing `test/ds/*` and `test/ai/*` suites):
  - `test/ds/icons.test.ts` (new): `normalizeIcon` strips the `lucide:` prefix,
    maps unknown/placeholder input to the fallback, and every `ICON_SLUGS` entry
    has a non-empty `<svg>` in the generated map.
  - `render-slide.test.ts`: card + callout render inline `<svg>`, never
    `iconify-icon`.
  - `assemble.test.ts`: output contains no `code.iconify.design` script and no
    `iconify-icon` tag.
  - `schema.test.ts`: `icon` accepts `"lucide:repeat"`, a bare `"repeat"`, and a
    junk value (coerced to fallback) without throwing.
  - `sample.test.ts`: the expanded `samplePlan` still parses and assembles.
  - `prompts.test.ts`: extend any existing assertions to cover the new examples
    if they assert on prompt content.

---

## Files Touched

New:
- `scripts/gen-icons.ts`
- `lib/ds/icons.ts`
- `lib/ds/icons.generated.ts` (generated, committed)
- `test/ds/icons.test.ts`

Modified:
- `lib/ds/schema.ts`
- `lib/ds/render-slide.ts`
- `lib/ds/templates/callout.ts`
- `lib/ds/templates/point.ts`
- `lib/ds/assemble.ts`
- `lib/export/capture.ts`
- `lib/ds/carousel-css.ts`
- `lib/ds/sample.ts`
- `lib/ai/prompts.ts`
- `package.json` (add `gen:icons` script)
- existing `test/ds/*`, `test/ai/prompts.test.ts` as noted

## Notes / Constraints

- Scope is confined to `lib/ds`, `lib/ai`, `lib/export`, `scripts`, and tests —
  no App Router / Next.js surface. Per `AGENTS.md`, consult
  `node_modules/next/dist/docs/` only if any App Router code turns out to need a
  touch (not expected).
- `renderIcon`'s default color `#E94B19` preserves the current brand-orange icon
  color; callers can override per placement.
- The codegen's fail-loud behavior is the enforcement mechanism for the "strict
  rule" — an icon that can't be sourced from `lucide-react` cannot ship.

## Success Criteria

- Preview and exported PNG show every icon, with the network disabled.
- No `iconify-icon` tags or `iconify.design` URLs remain in `lib/ds` or
  `lib/export`.
- A generated sample deck uses ≥3 distinct mockup types and rotating tones.
- The no-hook cover renders as a balanced, proportional text intro on 1080×1350.
- All existing and new tests pass.
