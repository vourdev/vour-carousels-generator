# Cover Ink Redesign + Trigger-Angle Cover System — Design Spec

**Date:** 2026-08-04
**Status:** Draft (brainstorming) → awaiting user review
**Targets:** `lib/ds/` (schema, templates, render-slide, carousel-css-extra) + `lib/ai/prompts.ts`
**Base branch:** `feat/cover-ink-redesign` (off `6eda847`)

---

## 1 · Purpose

Make generated cover slides look like the 5 approved dark "trigger-angle" covers
(DevOps · Network · Sysadmin · Developer · UI/UX): **Ink (dark) surface + Ember-bright
accent**, with one strong visual anchor per cover, driven by a trigger-angle framework so
the LLM never produces a flat cover again.

This is **not a palette change** — the v1.0 tokens already cover it (Ember `#EE4B1A`,
Ember-bright `#FF6A3D`, Ink `#14110E`). The change is: **covers always render on the Ink
surface** (today they render on Paper), plus three new cover-only visual anchors and
prompt guidance.

### Success criteria
- Every generated cover renders on Ink with an Ember-bright accent word.
- Three new anchors (`badge`, `nocgrid`, `door`) are first-class, LLM-fillable cover hooks.
- The LLM picks a trigger angle and an anchor that fits it, following the Cover framework.
- `npx tsc --noEmit` clean; no new failures in `test/ds/`; covers verified at 1080×1350.

### Non-goals
- **Slide bodies stay on Paper.** `DESIGN.md` locks "two surfaces only — Paper is default,
  Ink is an accent." A full-deck dark theme is explicitly out of scope (would require a
  DESIGN.md rewrite + readability audit).
- No new mockup types for slide bodies. Anchors here are cover-only.
- The standalone `cover-slides.html` preview file is a mockup, not shipped code.

---

## 2 · Current state (what exists)

- **Two cover variants** in `render-slide.ts` `case "cover"`:
  - no hook → `coverTemplate` (full-hero headline)
  - with hook → `coverCompactTemplate` + a hook fragment
- **Cover hooks today:** `coverHookSchema = device | image | custom` (`schema.ts`).
- **Covers render on Paper** — the default `section` background; `.cover-editorial` styling
  lives in `carousel-css-extra.ts`.
- **Ink infrastructure already exists** from the TASK 2 work: `section.ink` overrides in
  `carousel-css-extra.ts` (dark bg, Ember-bright eyebrow/accent, cream text, on-dark
  contrast fixes). This redesign builds directly on it.
- **`.badge` is already taken** in the DO-NOT-EDIT `carousel-css.ts` (the step-number
  badge). New cover badge anchor MUST use a different class (`.cover-badge`).

---

## 3 · Design decisions

### A · Scope — Cover = Ink, bodies = Paper
Covers always Ink; bodies unchanged (Paper, with optional per-slide `surface:"ink"` accent
from TASK 2). Rationale: honors DESIGN.md's two-surface rule, keeps long body copy readable
on cream, and makes covers "heavy" so they stand out mid-scroll (the brief's Step 4 goal).

### B · Anchors — 3 new + reuse 2 (YAGNI)
| Cover anchor (from approved set) | Decision | Why |
|---|---|---|
| Giant numeral (Developer) | **reuse `bigstat`** | already a giant editorial number |
| Before/after split (Sysadmin) | **reuse `comparison`** | already two-panel loser/winner |
| ID badge (DevOps) | **new `badge` hook** | no equivalent |
| NOC status grid (Network) | **new `nocgrid` hook** | no equivalent |
| Norman door (UI/UX) | **new `door` hook** | no equivalent |

### C · Model as cover HOOKS (not slide mockups)
Extend the existing `coverHookSchema` with three `kind`s. Covers own a "hook" slot for their
one visual anchor; that is the correct seam. These anchors never appear on body slides, so
they must NOT pollute the 20-member body `mockupSchema`.

```
coverHook = device | image | custom | badge | nocgrid | door   (+3)
cover render → always section.ink (cover-ink), Ember-bright accent
```

### D · "Always attractive" via trigger-angle prompt
Encode the user's Step 1–4 cover framework into `prompts.ts`:
- pick ONE of 6 angles: misconception · urgency/risk · curiosity-gap · numbered ·
  contrarian · before/after
- headline: hook word first (number / negative word / question), keep a curiosity gap,
  ≤10 words, credible (no misleading clickbait)
- exactly ONE visual anchor, chosen to fit the angle
- angle→anchor map: numbered→`bigstat` · before/after→`comparison` · risk→`nocgrid` ·
  contrarian→`badge` · misconception→`door` · curiosity→`device`/`image`
- cover is Ink; accent = Ember-bright on one keyword

### E · Content is LLM-filled (a real system, not 5 hardcoded covers)
Each anchor exposes topic fields the LLM fills, so any future topic reuses them:
badge.role, nocgrid.banner, door.label, etc.

---

## 4 · Schema changes (`lib/ds/schema.ts`)

Add to the `coverHookSchema` discriminated union:

```ts
const coverHookBadge = z.object({
  kind: z.literal("badge"),
  eyebrowLine: z.string().max(24).default("ID · 2026"), // mono kicker on the badge
  role: z.string().max(22),                              // e.g. "DevOps Engineer"
  sub: z.string().max(40).optional(),                    // e.g. "// dianggap satu job title"
  struck: z.boolean().optional(),                        // Ember strike-through (contrarian)
});

const coverHookNocGrid = z.object({
  kind: z.literal("nocgrid"),
  cols: z.number().int().min(3).max(6).default(6),
  rows: z.number().int().min(2).max(4).default(3),
  state: z.enum(["down", "up"]).default("down"),         // down = all-red, up = all-green
  banner: z.string().max(24).default("100% PACKET LOSS"),
});

const coverHookDoor = z.object({
  kind: z.literal("door"),
  label: z.string().max(12).default("DORONG"),           // the misleading affordance label
  pull: z.boolean().optional(),                          // pull handle shown (default true)
});
```

Union becomes: `[device, image, custom, badge, nocgrid, door]`.
No new top-level fields on `coverSlide`; the Ink surface is applied by the renderer, not a
schema flag (covers are *always* Ink).

---

## 5 · Render path (`lib/ds/render-slide.ts`)

- **Cover always Ink:** both cover fill calls add a surface class so the section becomes
  `section ... ink cover-ink`. (Templates get a `{{coverSurface}}` slot, filled `"ink cover-ink"`.)
- **Three new hook renderers**, following the existing `renderDeviceHook` pattern
  (sentinel injection, function-replacer for `$`-safety, `escapeHtml` on all user text):
  - `renderBadgeHook(h)` — badge card; strike element only when `h.struck`.
  - `renderNocGridHook(h)` — generate `cols*rows` node spans in a loop (NOT hand-written
    spans); each node an `x-circle` (down/red) or `check-circle` (up/green) via `renderIcon`.
  - `renderDoorHook(h)` — door panel with label + optional pull handle + hand glyph.
- Wire into the cover hook branch: `else if (h.kind === "badge") …` etc. The hook branch is
  a chain of `if/else` today; keep that shape (no exhaustive-switch requirement there, but
  add all three so no kind falls through to empty).

---

## 6 · CSS (`lib/ds/carousel-css-extra.ts`)

Append a "cover Ink" block (vars → hardcoded hex, matching existing style):
- `section.cover-ink` — Ink surface + Ember corner halo (ported from the approved preview).
  Reuses the existing `section.ink` text/eyebrow/accent overrides (already present).
- `.cover-badge` (+ `.cover-badge .strike`, `.hole`, `.brow`, `.role`, `.sub`) — the ID badge.
- `.cover-noc` (`.grid`, `.node`, `.banner`) — the status grid; red = `#C13B1A`/`#FF5A4D`.
- `.cover-door` (`.label`, `.handle`, `.hand`) — the Norman door.

No edits to `carousel-css.ts` (DO-NOT-EDIT). No class-name collisions (`.cover-*` prefix
avoids the existing `.badge`).

---

## 7 · Prompt (`lib/ai/prompts.ts`)

New **"COVER — trigger-angle framework"** block in the plan prompt:
- the 6 angles with one-line "when to use"
- headline rules (hook word first; curiosity gap; ≤10 words; credible)
- the angle→anchor mapping (§3D)
- cover surface = Ink, one Ember-bright accent word
- the new hook shapes documented alongside the existing `device`/`image`/`custom` hook docs

Existing cover-hook doc lines are extended, not replaced.

---

## 8 · Repair (`lib/ds/repair.ts`)

- `nocgrid` uses numeric `cols`/`rows` (clamped by Zod `.min/.max`), NOT an array field — so
  **no `MOCKUP_ARRAY_MAX` entry** is needed and none of the three anchors has a top-level
  array. Covers already flow through `repairSlidePlan`; a malformed hook that fails
  `coverHookSchema` should degrade gracefully (drop the hook → cover falls back to the
  full-hero `coverTemplate`, still valid). Confirm/add that fallback in repair if missing.

---

## 9 · Testing & verification

- **`test/ds/render-slide.test.ts`:**
  - cover renders contain `cover-ink`
  - each new hook (`badge`/`nocgrid`/`door`) renders its signature markup and no leftover
    sentinel
  - `nocgrid` emits exactly `cols*rows` nodes
  - user text is escaped; `$`-sequences preserved verbatim (function-replacer)
- **`test/ds/repair.test.ts`:** a cover with a malformed new hook does not throw (drops to
  full-hero cover).
- **Hard gates:** `npx tsc --noEmit` (0); `npx vitest run test/ds/` (no NEW failures beyond
  the 4 documented pre-existing); Playwright render of a plan with all 3 new cover hooks at
  1080×1350 (contrast + no-overlap, headline in the safe upper-middle zone).

---

## 10 · Files

**Modified:** `lib/ds/schema.ts`, `lib/ds/render-slide.ts`, `lib/ds/templates/cover.ts`,
`lib/ds/templates/cover-compact.ts`, `lib/ds/carousel-css-extra.ts`, `lib/ai/prompts.ts`,
`lib/ds/repair.ts`, `test/ds/render-slide.test.ts`, `test/ds/repair.test.ts`.

**Created:** `lib/ds/templates/cover-badge.ts`, `lib/ds/templates/cover-nocgrid.ts`,
`lib/ds/templates/cover-door.ts`.

---

## 11 · Open questions (assumptions taken; flag to reverse)

1. **Scope = Cover-Ink only** (bodies stay Paper). Assumed per DESIGN.md two-surface rule.
   Reverse → full-deck dark (bigger, needs DESIGN.md update).
2. **Content LLM-filled** (generative system). Assumed per "apply to the carousel system".
   Reverse → semi-static presets or hardcoded-5.
3. **before/after + numbered reuse existing** `comparison`/`bigstat` rather than new cover
   hooks. Reverse → dedicated cover hooks (more code, marginal gain).
