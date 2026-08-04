---
name: vour-dev-design
description: Use this skill to generate well-branded editorial carousels, slides, and adjacent assets for Vour Dev (@vourdev), either for production posts or throwaway prototypes/mocks. Contains the full DESIGN.md, pinned tokens, reference slides, and a self-contained AI bundle.
user-invocable: true
---

# @vourdev design system — how to invoke this skill

> **This file is a thin pointer, not a rulebook.** All design rules live in `DESIGN.md`. All build procedure lives in `MAKING_CAROUSELS.md`. If you find a rule stated here AND in `DESIGN.md`, **`DESIGN.md` wins.** Historical bug: earlier versions of this file duplicated rules and the two sources drifted apart. Update 6 fixes that by keeping this file thin.

## Read in this order

1. `DESIGN.md` — the system's brain. Every design rule (colors, type, spacing, mockup contract, intro contract, single-mockup rule, extended mockup catalog).
2. `MAKING_BRIEFS.md` — the Strategist layer: topic → Creative Brief (single source of truth per piece; upstream of every renderer).
3. `MAKING_CAROUSELS.md` — the procedure for turning a Markdown brief into an on-brand deck.
4. `CUSTOM-INSTRUCTIONS.md` — the v7 Creative Director operating prompt for Claude Projects (Phase 1 creative workflow + Phase 2 mechanical build).
5. `readme.md` — top-level index of what changed in each update and where to find each piece.

Then, if you're building anything, browse:

- `styles.css` + `tokens/` — drop-in CSS variables. Consumers link `styles.css` once.
- `TEMPLATE-editorial-v3.html` — the single starting template; every slide role as a copy-paste `<section>`.
- `EXAMPLE-editorial.html` — a full finished deck, end-to-end reference.
- `guidelines/` — small specimen cards.
- `slides/` — standalone sample slides at 1080×1350.
- `bundle/` — GENERATED self-contained copy for pasting into an external AI chat (`npm run gen:bundle`). Never edit by hand.
- `assets/vourdev-logo.jpeg` — always this file, never a substitute.

## When invoked

**First: load the `design-taste-frontend` skill** (if available) before building any carousel, slide, or mockup — every build prompt runs through its anti-slop filter. Precedence: `DESIGN.md` > `design-taste-frontend` > defaults. Vour's locked signatures (per-slide eyebrow, page counter, Iconify `lucide:*`, Inter body, EB Garamond stamps) override the taste skill's generic bans.

If the user invokes this skill without other guidance, ask them what they want to build (carousel? single slide? one mockup?), ask about topic + slide count + hook, then act as an expert designer who outputs HTML artifacts or production code.

**Ask before breaking any rule in `DESIGN.md`.** If your brief conflicts with the design system, surface the conflict — don't silently break the rule to satisfy the brief.

## Skill-level workflow rules

These are workflow / packaging rules — they don't overlap with `DESIGN.md`.

1. **Copy assets out.** If creating visual artifacts, copy `assets/vourdev-logo.jpeg` and any tokens/slides you use into the deliverable directory. Do not link across projects.
2. **Reuse tokens + components.** Never re-derive colors / type sizes / spacings inline; always link `styles.css` and use the design tokens.
3. **One brand mark source.** `assets/vourdev-logo.jpeg` (or the base64 in `bundle/DESIGN.md §3a` for standalone bundles). Never re-render as SVG, letters, or a "VD" wordmark.
4. **Every carousel HTML file ships the `vourdev-meta` automation block** (`DESIGN.md §21`). Use `""` for missing caption, `[]` for missing hashtags — never omit a key.
5. **Ask, don't guess.** New request without clear topic / slide count / hook → ask.

Everything else — colors, type scale, mockup contract, intro contract, single-mockup rule, mockup catalog — lives in `DESIGN.md`. Do not restate it here.

---

*v1.0 "Engineering Editorial" · 2026-08 · full DESIGN.md rewrite (legacy system archived at `DESIGN.legacy-update7.md`; tokens carry `--ed-*` aliases so pre-v1.0 templates keep rendering). This file stays a stub — all design rules live in `DESIGN.md`.*
