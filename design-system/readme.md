# Vour Dev — Design System (Update 7)

> **Update 7 is a mockup-catalog expansion — no new palette, no new surface.** Editorial cream + `--ed-orange` remains the only surface (§1–§18 unchanged). Update 7 adds **eleven new editorial mockup roles** to `DESIGN.md §19` so future carousels have real visual variety without inventing off-brand elements slide by slide. The 9 diagram roles (§13) and the 5 image / editorial mockups from Update 6 (§18) are all unchanged — the new roles sit alongside them on the "Mockups · Update 7" tab.

## What changed in Update 7

**Eleven new mockup roles**, each with a reference slide (`slides/18-…` through `slides/28-…`) and a specimen card (`guidelines/update7-mockup-…`):

1. **`NumeralHero`** — massive numeral + short headline underneath. For covers whose hook IS the number.
2. **`StackedContrast`** — vertical `SCRAPED / DESIGNED` or before/after info-card pair.
3. **`HistoryTimeline`** — two labeled date cards side-by-side ("earlier this year" → today).
4. **`AnnotatedIllustration`** — hero SVG (door, phone, product) with dashed leaders to labeled pill callouts.
5. **`BrowserMockup`** — realistic browser chrome + sidebar + product grid ("here's what I built").
6. **`StampBadge`** — small tilted corner sticker, orange border, punchline claim.
7. **`CommandList`** — mono `/command → description` menu.
8. **`PromptCard`** — bordered COPY THIS mono prompt card.
9. **`DataTable`** — general ✗ vs ✓ 2-column comparison table.
10. **`CatalogList`** — numbered-box rows with orange title + one-line description.
11. **`QuoteInset`** — italic left-border quote block on a stone card.

**No new tokens.** All eleven roles compose from the existing `--ed-*` palette, the existing `--ed-line-*` diagram accents, and the pinned type scale. `tokens/dark.css` / `tokens/backgrounds.css` dark variants are NOT part of this update.

**Every new role obeys §14** (mockup proportion contract), **§16** (intro contract), and **§17** (single mockup fills full width). See `DESIGN.md §19` for the full spec, sizing, and hard rules (roles cap at 4–6 rows, one accent surface per slide, no mixing with §13 diagrams in the same `.diag-wrap`).

## What changed in Update 6

1. **`SKILL.md` becomes a stub — no more duplicate rules.** Every design rule moved into `DESIGN.md`. `SKILL.md` only carries skill metadata + the workflow contract ("read `DESIGN.md` first"). This kills the long-running "skill and design.md conflict" bug.
2. **`DESIGN.md §16` — Slide-introduction contract.** Every slide's intro block (eyebrow → headline → description) has strict size-specific caps in words + chars + lines. Descriptions cap at 100 chars on mockup slides, 140 chars on text-only slides. Includes the "conjunction check" heuristic: more than one `dan / atau / tapi / kalau / karena` conjunction and the sentence is almost certainly too long.
3. **`DESIGN.md §17` — Single-mockup fills the full width.** ONE mockup → spans `.diag-wrap` (100% wide). TWO → 1fr / 1fr grid (`ImagePlatePair`, `.diag-bars`, `SplitPanel`). THREE–FOUR → `MediaGrid` 2×2. Never a single mockup in a half column with empty space beside it.
4. **`DESIGN.md §18` — Extended mockup catalog.** Five new mockup roles for topics that don't fit the §13 diagram vocabulary: full-bleed `ImagePlate`, before/after `ImagePlatePair`, `MediaGrid` (2×2 gallery), `BigStat` (metric), `PullQuote` (testimonial), `SplitPanel` (text + image side-by-side).
5. **New components:** `BigStat`, `PullQuote`, `SplitPanel`, `MediaGrid`. All obey §14 + §16 + §17.
6. **New sample slides:** `slides/20-mockup-full-bleed.html`, `21-mockup-big-stat.html`, `22-mockup-pull-quote.html`, `23-mockup-split-panel.html`, `24-mockup-media-grid.html`.
7. **Author checklist expanded** from 12 to 16 items (adds mockup contract, `vourdev-meta` block, intro contract, single-mockup rule).

## What changed in Update 5 (still holds)

1. **Mockup slide proportion contract.** New `DESIGN.md §14` + `MAKING_CAROUSELS.md §8` lock the vertical stack on every slide carrying a mock-screen. Headline is `h1.compact` (88px), description ≤ 2 lines / 120 chars, `.diag-wrap` gets `flex:1; min-height:0`, terminal body ≤ 8 lines / 44 chars per line. If it doesn't fit, cut copy — never touch the CSS.
2. **Content length caps.** New `MAKING_CAROUSELS.md §9` publishes explicit char/line budgets per element (cover headline ≤ 30 chars, info-card title ≤ 6 words, terminal line ≤ 44 mono chars, etc.).
3. **`vourdev-meta` automation block.** New `DESIGN.md §15` + `MAKING_CAROUSELS.md §10` require a `<script type="application/json" id="vourdev-meta">` block inside `<head>` on every carousel. Fields: `title`, `caption`, `hashtags`. Never omit a key — the pipeline breaks silently otherwise.
4. **Mockup-role selection matrix.** Explicit topic→role mapping (database queries → Terminal; auth flow → Illustrated Scene; role matrix → Permission Table; bad-vs-good → Comparison Bars).
5. **Bundle template updated.** `TEMPLATE-editorial-v3.html` ships with the metadata placeholder in `<head>`, adds `.diag-wrap` + `h1.compact` classes, and every mockup slide already uses the locked stack.
6. **`SKILL.md` hard rules extended** — rules 6 (proportion contract) and 7 (required metadata block) added.

## What changed in Update 4 (still holds)

1. **Synthwave surface removed.** Deleted the `--vd-*` palette, `--bg-slide` / `--bg-slide-outro`, `--fs-hero`, `--fs-title-tt`, `--fs-eyebrow-vd`, TikTok padding tokens, synthwave shadows / glows, and the `--pad-tile` inner.
2. **Components trimmed.** `SlideShell`, `Eyebrow`, `PageCounter`, and `BrandHeader` no longer accept a `surface` prop — they are editorial by definition. `IconTile`, `CtaCircle`, and `CtaStrip` are removed.
3. **Slide 14 `mock-screen` pattern redesigned.** Title / eyebrow / description / mock-screen now sit proportionally; the locked panel uses a dark `.mock-lock` pill (lucide icon + label) so the overlay never overlaps the dimmed fields behind it. Same pattern propagated to `TEMPLATE-editorial-v3.html` and `guidelines/update3-scene-illustrated.html`.
4. **Type scale renamed for clarity.** `--fs-title-lg` (128, cover) · `--fs-title` (104, inner) · `--fs-title-sm` (88, compact). The old `--fs-hero` / `--fs-title-tt` are gone.

## What changed in Update 3

1. **New token file** — `tokens/diagrams.css` with nine warm-editorial accent colours (`--ed-line-orange/mint/sky/amber/pink/red/ink/muted`), the `--ed-node-fill` off-white, pinned stroke widths, and pinned node radii.
2. **The `.node` primitive** — every diagram is built from one line-art rounded rectangle with variants (`.filled` orange, `.big` hub, `.mint/.sky/.amber/.pink/.red` topic borders).
3. **Nine diagram slide roles** — concept-hub, flow-chain, token-strip, comparison-bars, icon-hub, illustrated-scene, permission-table, terminal, recap-checklist. See `DESIGN.md §13` for full specs.
4. **CATATAN recap panel** — optional 22px mono label + 32px Sora body under any diagram. At most one per slide.
5. **Bundle template** — `TEMPLATE-editorial-v3.html` with every pattern as a copy-paste `<section>`.
6. **End-to-end example** — `EXAMPLE-editorial.html`: a full finished deck wiring the whole vocabulary together.

## What changed in Update 2 (still holds)

1. **Single-value type / spacing / icon scale.** No ranges.
2. **Opaque icon containers.** Editorial info-card icons use `--ed-icon-tile-bg`.
3. **Expanded editorial card palette** (`--ed-card-mint | sky | pink | amber`).

## Where to read what

| File | What's in it |
|---|---|
| `DESIGN.md` | The brain. Read this first — every "what · why · when" lives here. |
| `MAKING_CAROUSELS.md` | **How** to turn a Markdown carousel brief into an on-brand deck. |
| `styles.css` | The single entry — `@import`s every token file. |
| `tokens/` | Colors, type, spacing, radius, effects, icon, backgrounds, fonts, diagrams, reset. |
| `TEMPLATE-editorial-v3.html` | The single starting template — every slide role as a copy-paste `<section>`. |
| `EXAMPLE-editorial.html` | A full finished deck, end-to-end reference. |
| `guidelines/` | Foundation cards — colors, type, spacing, icon sizes, brand mark, nine `update3-*` diagram cards. |
| `slides/` | Sample slides — editorial cover / icon-cards / comparison / numbered / outro (01–05), nine Update 3 diagram roles (09–17), Update 5 image-insert examples (18–19), Update 6 extended mockup roles (20–24). |
| `bundle/` | GENERATED self-contained AI-chat bundle (`npm run gen:bundle` from repo root). Never edit by hand. |
| `assets/vourdev-logo.jpeg` | The brand mark. Always this file, never a substitute. |
| `SKILL.md` | Drop-in skill manifest for Claude Code import. |

## Content fundamentals

Casual Indonesian, first-person (`saya`), tech terms in English. `kamu` only inside CTAs. Never `kami`. No emoji inline with body copy. Eyebrows ALL CAPS. Body sentence case. Headlines title case.

Length budget per slide: title 1–3 words · body 6–14 words per line, 1–3 lines · slide 30–60 words total (max 80) · deck 6–10 slides.

## Visual foundations

- **Editorial cream + orange, always.** `--bg-editorial` (cream + soft corner halo) + `--ed-orange` for eyebrows, accent words, and one accent node per diagram.
- **Icon containers are opaque.** Editorial info-card icons use `--ed-icon-tile-bg` (`rgba(31,9,4,0.06)`). Never let the paper halo show through.
- **Single-value type scale.** `--fs-title-lg` = 128. `--fs-title` = 104. `--fs-title-sm` = 88. `--fs-lead` = 40. `--fs-body-lg` = 32. `--fs-body` = 28. Page counter and eyebrow are 24. Don't interpolate.
- **`.node` is the diagram primitive.** One highlighted node per diagram (`.filled` orange, or a topic-accent border). Everything else stays default ink.

## Iconography

Iconify only. `simple-icons:*` for brand logos. `lucide:*` for concept icons. Container and glyph sizes per role are in `guidelines/icon-sizes.html`.

## Caveats / open questions

- **Logo file is still a JPEG.** SVG / transparent PNG is still on the wishlist.
- **No font binaries shipped.** Sora / Nunito / JetBrains Mono are pulled from Google Fonts. For print-ready surfaces, host `.woff2` locally.
- **Editorial card-tone mapping** (mint=success, sky=tooling, …) is my call; if `@vourdev` has its own topic→tone preference, swap the values in `tokens/colors.css`.
