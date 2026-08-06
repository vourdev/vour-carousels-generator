# Handoff — Vour Design System v1.0 port

**Status:** carousel generator (`lib/ds`) is on Design System v1.0. This doc lists what remains so another team can continue without re-deriving context.

**Last updated:** 2026-08-04

---

## 1. Context (what this is)

Vour publishes 1080×1350 developer-education carousels. There are **two parallel implementations of the same design system**, and they must stay in sync:

| Surface | Where | Purpose |
|---|---|---|
| **Docs / templates** | `design-system/` | Human + external-AI reference (`DESIGN.md` is the source of truth), copy-paste HTML template, bundle for pasting into ChatGPT/Claude. |
| **Code generator** | `lib/ds/` + `lib/ai/` | The SaaS `/create` pipeline: brief → LLM slide-plan (Zod) → HTML via string templates. |

Design System **v1.0 "Engineering Editorial"** replaced the legacy editorial-cream system. Key facts:

- **Palette:** two surfaces — Paper `#FBF6EF` (default) + Ink `#14110E` (dark). One accent: **Ember `#EE4B1A`**. Text ink `#1C0A05`. Max 3 colors per slide.
- **Type:** Sora (display) · Inter (body) · JetBrains Mono (code/eyebrow/counter) · EB Garamond italic (signature serif — stamps, pull-quotes only).
- **Physics (never change):** 1080×1350 canvas, 8px grid, screenshot export (no `backdrop-filter`), Iconify-only icons, the `vourdev-meta` JSON block in `<head>` (Buffer export depends on it).
- Full rules: `design-system/DESIGN.md`. Legacy archived at `design-system/DESIGN.legacy-update7.md`.

### Pipeline layers (all wired)
```
topic → MAKING_BRIEFS.md (Strategist) → Creative Brief
      → CUSTOM-INSTRUCTIONS.md v7 (Creative Director: creative + build)
      → MAKING_CAROUSELS.md (slide-brief format)
      → lib/ds generator  →  HTML  →  image export
```

---

## 2. Done (do not redo)

- `lib/ds` fully on v1.0 palette + fonts (Sora/Inter/JetBrains/EB Garamond; Nunito removed). Zero old-palette refs.
- Generator **crash fix**: `concept`/`hub`/`checklist` min counts relaxed to 2; `lib/ds/hub-lines.ts` supports 2–4 nodes; **`lib/ds/repair.ts`** repairs recoverable LLM output (clamps arrays, drops unrecoverable mockups → auto-card fallback, truncates over-long copy, strips em-dashes, defaults missing keys) before final Zod validation.
- **15 mockup types** in the generator: `card · terminal · comparison · steps · callout · bigstat · flow · concept · hub · checklist · browser · quote · datatable · commandlist · timeline`.
- Reference decks (verified, on-brand): `design-system/SHOWCASE-docker.html` (8-slide narrative), `design-system/SHOWCASE-mockups.html` (mockup gallery). **Use these as the visual + markup source of truth for remaining mockups.**

**Update 2026-08-04 (b):**
- **TASK 1 DONE** — 5 more mockups shipped (`promptcard · foldertree · commandpalette · database · gitbranch`). Generator now **20 mockup types**. All render-verified via `assembleCarousel` + screenshot.
- **TASK 2 DONE** — full-Ink point surface shipped (`surface: "paper"|"ink"` on point slides; `section.ink` overrides in `carousel-css-extra.ts`). Verified: a `concept` on an ink slide renders dark bg + cream text + ember accent.
- **Visual Director policy wired** into `lib/ai/prompts.ts` — `MOCKUP_VARIETY_RULE` rewritten with the 7 content categories → real 20-type map, anti-repetition, dark-mockup budget (terminal+commandpalette ≤1/5, browser ≤1/deck), surface rhythm. Also fixed a latent bug: the prompt catalog (brief + plan stages) previously advertised **legacy mockup names the renderer can't draw** (`ImagePlate/SplitPanel/MediaGrid/NumeralHero/StampBadge/CatalogList/PullQuote/StackedContrast/AnnotatedIllustration/HistoryTimeline`) → LLM emitted invalid types → dropped to plain cards ("biasa"). All references replaced with the real 20 types. The 5 Stage-B types (browser/quote/datatable/commandlist/timeline) were also missing from the plan-stage numbered list — now added (16–20).

---

## 3. TODO — prioritized

### TASK 1 — Port remaining mockup types ✅ DONE (2026-08-04)

> Shipped: promptcard, foldertree, commandpalette, database, gitbranch. Kept below for the recipe (reuse when adding future types).


Add 5 more mockup roles to the generator so decks have more visual variety. Markup + CSS already exist and are verified in **`design-system/SHOWCASE-mockups.html`** — port them, don't reinvent.

**The 6-touchpoint recipe (per mockup type):**
1. `lib/ds/schema.ts` — add a `z.object({ type: z.literal("<name>"), ... })` and append it to the `mockupSchema` discriminatedUnion.
2. `lib/ds/templates/<name>.ts` — export the template string. Fixed fields → `{{slot}}` (auto-escaped by `fillTemplate`). Array/raw-HTML → `XXX_INJECT` sentinel (escape manually in render).
3. `lib/ds/render-slide.ts` — add `render<Name>Mockup(m)` + a `case "<name>":` in `renderMockup`'s switch (switch is exhaustive — TS will fail the build until you add it).
4. `lib/ds/carousel-css-extra.ts` — add the component CSS. **Do NOT edit `lib/ds/carousel-css.ts`** (it is the verbatim DO-NOT-EDIT block).
5. `lib/ai/prompts.ts` — add one line to the mockup catalog (`MOCKUP_TYPES` guidance, ~line 24) so the LLM emits it, with field caps + a "when to reach for it" hint.
6. `lib/ds/repair.ts` — if the type has a capped array, add it to `MOCKUP_ARRAY_MAX`.

**The 5 remaining types (proposed schemas — adjust caps to match SHOWCASE):**

| Type | Proposed fields (with char caps) | SHOWCASE source |
|---|---|---|
| `promptcard` | `label` (≤20, default "COPY THIS") · `body` (≤180) | slide "Prompt Card" — 2px ember border, corner label, mono body |
| `foldertree` | `lines`: array 3–8 of `{ text ≤48, active?: boolean }` | slide "Folder Tree" — mono tree, active row Ember |
| `database` | `tables`: array 2 of `{ name ≤20, rows: array 2–4 of {col ≤16, type ≤8} }` · `relation` (≤12, e.g. "1 ─< ∞") | slide "Database" — two tables + relation glyph |
| `commandpalette` | `query` (≤30) · `rows`: array 2–5 of `{ icon, label ≤40, active?: boolean }` | slide "Command Palette" — **Ink surface**, ember caret + active row |
| `gitbranch` | `main`: array of commit labels · `branch`: `{ name ≤16, at: index }` · `mergeLabel` (≤12) | slide "Git Branch" — SVG branch/merge, Ember feature line |

Notes:
- `commandpalette` renders on Ink (`#14110E`); reuse the dark styling pattern from the `terminal` component. Ember accent uses `#FF6A3D` (ember-bright) on dark.
- `gitbranch` is an SVG diagram; copy the `<svg>` from SHOWCASE verbatim and parameterize commit x-positions. Keep stroke `#EE4B1A` for the feature branch, `#1C0A05` for main. If parameterizing the SVG is too fiddly, ship a fixed 2-branch layout first.
- `database` relation glyph: keep it a plain mono string to avoid layout math.

**Acceptance criteria (each type):**
- `npx tsc --noEmit` clean.
- Renders via `assembleCarousel` at 1080×1350 with no overlap, inside the 80/96/80 padding box (see verification recipe §4).
- An intentionally-broken instance (e.g. array below min, over-long string) does **not** crash generation — `repair.ts` drops it to an auto-card. Add a case to the repair test (§4) proving it.

### TASK 2 — Full-Ink surface slides ✅ DONE (2026-08-04)

> Shipped: `surface: "paper"|"ink"` on point slides, `section.ink` overrides in `carousel-css-extra.ts`. Spec kept below for reference.


Today only `terminal`/`callout`/`commandpalette` are dark *cards* on a Paper slide. The reference deck (`SHOWCASE-docker.html`) alternates **entire Ink slides** for rhythm. To support that:

- `lib/ds/schema.ts` — add `surface: z.enum(["paper","ink"]).default("paper")` to `pointSlide` (and optionally cover/outro).
- `lib/ds/render-slide.ts` — when `surface==="ink"`, add class `ink` to the `<section>` (point template needs a `{{surfaceClass}}` slot).
- `lib/ds/carousel-css.ts` is DO-NOT-EDIT; put `section.ink { ... }` overrides in `carousel-css-extra.ts` (background `#14110E`, text `#F7F1E8`, eyebrow/counter/accent on-dark variants, node/card borders on dark). Mirror the `.slide.ink` rules from `SHOWCASE-docker.html`.
- `lib/ai/prompts.ts` — instruct: max ~1 Ink slide per 3, never two in a row (DESIGN.md §13 rhythm).
- Acceptance: a plan with a mixed Paper/Ink deck renders both surfaces correctly; contrast holds.

### TASK 3 — Refresh static specimens (LOW, cosmetic)

These are reference-only HTML (not build-critical) still on the **old palette/fonts**:
- `design-system/slides/*.html`
- `design-system/guidelines/*.html`

Re-render or find-replace to v1.0 (`#E94B19`→`#EE4B1A`, `#1F0904`→`#1C0A05`/`#14110E` by context, Nunito→Inter, add EB Garamond loader). Cross-check against `DESIGN.md` §-numbers. Low priority — nothing in the pipeline reads them.

### TASK 4 — Reconcile `MAKING_CAROUSELS.md` section refs (LOW, docs)

Its body still cites legacy `§13–§19` numbering (the header already points readers to `DESIGN.legacy-update7.md` for those). Either renumber to v1.0 `DESIGN.md` sections or leave the pointer. Component vocabulary is unchanged — only numbering drifted.

### TASK 5 — Visual Director capability gaps (NEW, from the Visual Director spec)

The Visual Director policy is wired into the prompts, but four of its requirements have **no generator capability yet** — the prompt currently tells the LLM to pick the closest available mockup instead of faking them. Build these to fully satisfy the spec:

- **`illustration` mockup (ABSTRACT / analogy)** — a non-technical custom illustration for abstract concepts (the spec wants analogy art, explicitly *not* a browser/terminal). Hard part: illustration is bespoke. Realistic scope: a small library of **parametric line-art SVG scenes** (e.g. lock, door, pipe, scale/timbangan, box) with 1–3 labeled callouts, styled per §9 of `DESIGN.md` (2px ink stroke, one ember fill). Schema: `{ type:"illustration", scene: enum, labels: [...] }`.
- **`imageplate` mockup (EVIDENCE / real screenshot)** — let a point slide carry a user-supplied screenshot. `schema.ts` already has a reserved `coverHookImage` (cover only); extend to a point mockup `{ type:"imageplate", src, frame:"browser"|"phone"|"plain", caption? }` and wire an upload in `app/create/wizard.tsx`. When no image is supplied, the LLM must emit a `[BUTUH SCREENSHOT ASLI: <desc>]` marker (spec STEP 2) rather than a placeholder.
- **Human element** — spec wants a "manusiawi" element (hand/person/character) every 3–4 slides. No asset class exists. Options: a small set of line-art character/hand SVGs, or an illustration-scene variant. Decide art direction with design before building.
- **Per-slide background variety** — spec wants `background_style` to differ slide-to-slide (gradient / dot pattern / blueprint / texture). Generator currently only has `paper` + `ink`. Add a `background` enum on slides (e.g. `paper | paper-dot | blueprint | ink`) with CSS in `carousel-css-extra.ts` (blueprint grid already exists as a token in `design-system/tokens/backgrounds.css` — mirror it). Keep it subtle (halo/paper stays the brand default; DESIGN.md §8 forbids mesh/noise-over-text).

Until built, these stay documented as "NOT AVAILABLE" in `MOCKUP_VARIETY_RULE` so the LLM degrades gracefully instead of emitting broken mockups.

---

## 4. Verification recipe (how to prove a change works)

The repo has `playwright` installed. No dev server needed — render to a file and screenshot.

**Render a plan to HTML:**
```ts
// scratch.mts — run with: npx tsx scratch.mts
import { assembleCarousel } from "@/lib/ds/assemble";
import type { SlidePlan } from "@/lib/ds/schema";
import { writeFileSync } from "node:fs";
const plan: SlidePlan = { title:"t", caption:"", hashtags:[], slides:[ /* your slides */ ] };
writeFileSync("out.html", assembleCarousel(plan));
```

**Screenshot each slide at exact canvas size:**
```js
// shot.mjs — run with: node shot.mjs
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await p.goto("file://" + process.cwd() + "/out.html", { waitUntil: "networkidle" });
await p.waitForTimeout(1500); // let webfonts settle
const s = await p.$$("section");
for (let i = 0; i < s.length; i++) await s[i].screenshot({ path: `slide-${i+1}.png` });
await b.close();
```

**Repair-layer test pattern** (extend for each new type):
```ts
import { repairSlidePlan } from "@/lib/ds/repair";
// under-min / over-max / over-long / em-dash inputs must NOT throw:
const p = repairSlidePlan({ title:"t", caption:"", hashtags:[], slides:[ /* broken mockup */ ] });
// assert the bad mockup was dropped or clamped, plan still valid
```

**Always run before declaring done:** `npx tsc --noEmit` (the mockup switch is exhaustive — missing a case fails the build).

---

## 5. Invariants — do not break

1. **`lib/ds/carousel-css.ts` is verbatim / DO-NOT-EDIT.** All new component CSS goes in `carousel-css-extra.ts`.
2. **`repair.ts` is the safety net.** Generation must never hard-crash on recoverable LLM output. If you add a mockup with array mins, ensure repair clamps/drops it — a bad diagram must degrade to an auto-card, never kill the deck. (This was a real production crash: `slides[n].mockup.children too_small`.)
3. **No em-dash (`—`) in slide copy.** `repair.ts` strips them; keep it that way.
4. **Physics:** 1080×1350, 8px grid, no `backdrop-filter`, Iconify-only, `vourdev-meta` block always present. `lib/ds/fonts-inline.ts` is auto-generated (`node scripts/gen-inline-fonts.mjs`) — never hand-edit; if you add a font family, update the script's `CSS_URL` and regenerate.
5. **DESIGN.md wins.** If code and `DESIGN.md` disagree, `DESIGN.md` is the source of truth — fix the code (or update DESIGN.md deliberately, then the docs bundle via `npm run gen:bundle`).
6. **Keep docs + generator in sync.** A new mockup in `lib/ds` should also be described in `DESIGN.md` §5 and, ideally, shown in `SHOWCASE-mockups.html`.

---

## 6. File map (quick reference)

```
design-system/
  DESIGN.md                     # source of truth (v1.0)
  DESIGN.legacy-update7.md      # archived old system
  MAKING_BRIEFS.md              # Strategist layer
  MAKING_CAROUSELS.md           # slide-brief procedure (§refs need reconcile — TASK 4)
  CUSTOM-INSTRUCTIONS.md        # v7 Creative Director prompt (for Claude Projects)
  SHOWCASE-docker.html          # reference narrative deck (dual-surface)
  SHOWCASE-mockups.html         # reference mockup gallery (source for TASK 1)
  tokens/*.css                  # v1.0 tokens + legacy --ed-* aliases
  slides/*, guidelines/*        # static specimens (old palette — TASK 3)
  bundle/                       # generated: npm run gen:bundle

lib/ds/
  schema.ts                     # Zod slide/mockup schema (add types here — TASK 1.1)
  repair.ts                     # crash-safety layer (TASK 1.6 / invariant 2)
  render-slide.ts               # mockup renderers + switch (TASK 1.3)
  carousel-css.ts               # DO NOT EDIT (verbatim v1.0 block)
  carousel-css-extra.ts         # additive CSS (TASK 1.4 / 2)
  assemble.ts                   # full-deck HTML assembler (used in verification)
  templates/*.ts                # per-mockup template strings (TASK 1.2)
  hub-lines.ts                  # SVG connectors (supports 2–4 nodes)
  fonts-inline.ts               # AUTO-GENERATED base64 @font-face
  sample.ts                     # example SlidePlan (handy for rendering)

lib/ai/
  prompts.ts                    # LLM prompts + mockup catalog (TASK 1.5)
  generate.ts                   # generateObject + repair fallback

scripts/
  gen-inline-fonts.mjs          # regenerates fonts-inline.ts
  gen-bundle.mjs                # regenerates design-system/bundle/
```

---

*Owner handoff: the port (palette + fonts + 15 mockups + crash-safety) is complete and verified. TASK 1 (5 more mockups) is the highest-value continuation and is fully specified above — each is a mechanical 6-file change with a verified visual reference in `SHOWCASE-mockups.html`.*
