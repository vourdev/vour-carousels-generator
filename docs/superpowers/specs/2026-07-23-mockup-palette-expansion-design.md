# Design — Mockup Palette Expansion (Flow / Hub / Concept / Checklist)

Date: 2026-07-23
Status: Approved (design), pending spec review

## Problem

Decks look monotone — the AI over-uses the `terminal` mockup, and the carousel
design system (`lib/ds`) exposes only 6 of the diagram components the reference
carousels actually use. The Vour Dev Design System bundle
(`Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html`) ships **nine**
diagram roles (D1–D9); only D4 (comparison) and D8 (terminal) are wired as
mockups today. The rich flow/hub/concept/checklist components sit unused, and the
prompt does not steer the model to pick a mockup by slide context.

## Goal

- Wire the four highest-impact unused DS components as new mockup types so the AI
  has a varied, on-brand palette: **flow-chain, icon-hub, concept-hub, recap
  checklist**.
- Make mockup selection **context-driven**: use the component that fits the
  slide's content; use `terminal` only when the slide genuinely shows code/CLI/
  config, capped at ≤1 per deck; every deck combines ≥3 distinct mockup types.
- Reuse the existing inline-SVG icon allowlist for hub tool glyphs.

## Non-Goals

- No new CSS. The classes for all four components already ship in the verbatim
  DS-bundle block `lib/ds/carousel-css.ts` (`.diag-flow`, `.diag-hub`,
  `.diag-icon-hub`, `.checklist`, `.catatan`, `.node`, `.arrow`, `.children`,
  `.tools`, `.tool`, `.glyph`, `.label`, `.tick`, `.center`, `.lines`).
- No changes to fonts, the icon allowlist, the cover, or the export pipeline.
- No new slide roles — all four are `point`-slide **mockup fragments** (same as
  `comparison`/`terminal`), keeping one wiring pattern. (The bundle's D9 is a
  standalone recap slide; we adapt its `<ul class="checklist">` as a fragment
  usable on any point slide, driven by the slide's own headline/body.)
- The remaining unused components (D3 token-strip, D6 illustrated-scene, D7
  permission-table) are deferred to a possible phase 2.

## Architecture

Each new mockup follows the established fragment pattern
(`lib/ds/render-slide.ts` → `renderMockup` switch → template with a raw-injection
sentinel). Palette grows **6 → 10**.

### New mockup schema members (`lib/ds/schema.ts`)

Added to the `mockupSchema` discriminated union. Copy budgets keep content on the
fixed 1080×1350 canvas.

1. `flow` — `{ type:"flow", steps: [{ label: string(≤24), focus?: boolean }] (2–5), note?: string(≤90) }`
2. `hub` — `{ type:"hub", center: string(≤20), tools: [{ icon: iconField, label: string(≤16) }] (3–4), note?: string(≤90) }`
3. `concept` — `{ type:"concept", parent: string(≤20), children: [string(≤18)] (3–4), note?: string(≤90) }`
4. `checklist` — `{ type:"checklist", items: [string(≤48)] (3–6), note?: string(≤90) }`

`iconField` is the existing `z.string().transform(normalizeIcon)` — hub tool
icons coerce to the allowlist (fallback `sparkles`), same as card/callout.
`note` renders the optional `.catatan` annotation strip (D1/D2/D5 use it).

### New templates (`lib/ds/templates/{flow,hub,concept,checklist}.ts`)

Copied verbatim from the D1/D2/D5/D9 sections of `TEMPLATE-editorial-v3.html`,
with `[placeholders]` rewritten as `{{slot}}` markers and the repeated
(steps / tools / children / items / icon / note) regions rewritten as raw-inject
sentinels (`FLOW_NODES_INJECT`, `HUB_TOOLS_INJECT`, `CONCEPT_CHILDREN_INJECT`,
`CHECKLIST_ITEMS_INJECT`, `HUB_LINES_INJECT`, `CONCEPT_LINES_INJECT`,
`NOTE_INJECT`) — the same `String.replace(sentinel, () => html)` function-replacer
pattern already used for `MOCKUP_INJECT`/`ICON_INJECT`, so `$`-sequences in copy
can't corrupt output.

### Render functions (`lib/ds/render-slide.ts`)

- `renderFlowMockup` — emit `.node` divs (the `focus` one gets `.node.filled`)
  separated by `<div class="arrow">→</div>`; append optional `.catatan`.
- `renderHubMockup` — emit `.tool` blocks (`.glyph` = `renderIcon(tool.icon, {size,color})`,
  `.label` = tool.label), the center `.node.filled.big`, and the connector SVG
  from `hubLinesSvg(tools.length)`; append optional `.catatan`.
- `renderConceptMockup` — emit `.children` `.node` pills, the parent
  `.node.filled.big`, and `conceptLinesSvg(children.length)`; append optional
  `.catatan`.
- `renderChecklistMockup` — emit `<li><span class="tick">✓</span> …</li>` per
  item inside `<ul class="checklist">`; append optional `.catatan`.

All four are added to the `renderMockup` switch. Icons/notes are injected via
function-replacers (never through `fillTemplate`, which escapes and interprets
`$`).

### Connector SVG helper (hub + concept)

The bundle SVG hard-codes four endpoints. A small pure helper generates the
curved paths + arrowheads from the node count so 3 or 4 nodes both align with the
flexbox `space-between` layout:

- viewBox `0 0 920 400` (hub) / `0 0 920 380` (concept); center top at `(460, 96)`.
- Endpoint x-positions: `n===4 → [110, 343, 577, 810]`, `n===3 → [110, 460, 810]`.
- Each endpoint: `<path class="stroke" d="M 460 96 Q 460 220 {x} {endY}"/>` plus a
  triangular `<polygon class="head">` arrowhead just above it.

Kept as one tested helper (input: count → output: SVG string) so the geometry is
verifiable in isolation.

## Prompt changes (`lib/ai/prompts.ts`) — context-driven selection

- Document the four new mockup types in `planSystem` with **when-to-use**:
  - `flow` → pipelines / ordered sequences (request → handler → db).
  - `hub` → one thing wiring out to several tools/services ("X connects to A,B,C,D").
  - `concept` → a term broken into its sub-concepts (glossary/foundation).
  - `checklist` → recap / "what you learned" summary.
- Replace the blanket variety rule with a **context rule**: choose the mockup that
  best fits the slide's content; use `terminal` **only** when the slide shows real
  code/CLI/config, at most **once per deck**; every deck uses **≥3 distinct**
  mockup types and avoids repeating a type on consecutive slides.
- Extend the existing VARIETY EXAMPLE to rotate flow/hub/concept/checklist.
- Hub tool icons and any diagram icons must come from the allowlist (already
  enforced by the ICON RULES block).

## Sample deck (`lib/ds/sample.ts`)

Add point slides exercising `flow`, `hub`, `concept`, and `checklist` so the
default preview and the assemble/schema fixtures showcase the expanded palette.
All icons from the allowlist; all copy within budget.

## Testing (mirror `test/ds/*`, `test/ai/prompts.test.ts`)

- `schema.test.ts` — each new type parses; hub tool `icon` coerces
  (`lucide:database` → `database`, junk → `sparkles`); min/max bounds enforced
  (flow 2–5, hub/concept 3–4, checklist 3–6).
- `render-slide.test.ts` — flow emits `.diag-flow` + `.arrow`; hub emits
  `.diag-icon-hub` + inline `<svg` (glyph) + connector paths; concept emits
  `.diag-hub` + child `.node`s; checklist emits `<ul class="checklist"` + `.tick`;
  `note` renders `.catatan`; no `*_INJECT` sentinel or `iconify-icon` leaks;
  `$`-sequences in copy survive verbatim.
- `hub-lines.test.ts` (new) — the connector-SVG helper returns 4 paths for 4
  nodes, 3 for 3, always well-formed (`M 460 96`, one `<polygon` per path).
- `assemble.test.ts` — a deck using the new types stays CDN-free (no
  `iconify.design`, no `iconify-icon`).
- `sample.test.ts` — expanded `samplePlan` still parses/assembles; exercises ≥4
  mockup types.
- `prompts.test.ts` — `planSystem` documents `"flow"`, `"hub"`, `"concept"`,
  `"checklist"` and the terminal-context/≤1 rule.

## Files

New: `lib/ds/templates/flow.ts`, `hub.ts`, `concept.ts`, `checklist.ts`;
`lib/ds/hub-lines.ts` (connector helper); `test/ds/hub-lines.test.ts`.
Modified: `lib/ds/schema.ts`, `lib/ds/render-slide.ts`, `lib/ds/sample.ts`,
`lib/ai/prompts.ts`, and the existing `test/ds/*` / `test/ai/prompts.test.ts`.

## Constraints / Notes

- Scope confined to `lib/ds`, `lib/ai`, and tests — no App Router / Next.js
  surface (AGENTS.md: consult `node_modules/next/dist/docs/` only if that changes).
- Hub/concept fixed at **3–4** nodes to match the generated connector geometry;
  the model is instructed to supply 3 or 4.
- Template markup is copied verbatim from the DS bundle to preserve pixel parity;
  only repeated regions and icons become sentinels.

## Success Criteria

- Generating a deck yields varied mockups (flow/hub/concept/checklist appear),
  terminal ≤1 and only on genuine code slides.
- All four render correctly in preview AND exported PNG (inline SVG, no CDN).
- Connector diagrams align for both 3- and 4-node hubs/concepts.
- All existing and new tests pass; `tsc --noEmit` and lint (changed files) clean.
