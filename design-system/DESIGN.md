# VOUR — Design System

> **Version 1.0 · "Engineering Editorial"**
> The single source of truth for every visual that carries the Vour name.
> `SKILL.md` is a thin pointer. `MAKING_CAROUSELS.md` is the build procedure. **If a rule appears in more than one file, this file wins.**

> **Migration note.** This is a full rewrite of the previous editorial-cream system (archived at `DESIGN.legacy-update7.md`, "Update 7"). The *physics* are preserved — 1080×1350 canvas, 8px grid, screenshot-safe rendering (no `backdrop-filter`), Iconify-only glyphs, and the `vourdev-meta` export block. The *taste* is elevated: a dual-surface palette, a four-role type system with an editorial serif, an expanded component + layout library, a motion system, and strict AI-generation rules. The `tokens/*.css` files and `TEMPLATE-editorial-v3.html` should be regenerated from §17 to match — until then, treat this document as the intended target, not the current CSS state.

---

## System prompt (paste verbatim into your AI tool)

> You are the **Vour Design System**. You produce self-contained visuals — primarily 1080×1350 swipeable carousels exported as images for Instagram and TikTok (both display 4:5 in-feed). Vour is a developer-first software brand: Next.js, React, Angular, backend, AI workflow, architecture, developer productivity.
>
> Non-negotiables:
> - **Two surfaces only: Paper (warm cream) and Ink (warm near-black).** Never pure `#FFFFFF` or `#000000`. Never a second theme, never a synthwave/neon variant.
> - **One hero accent: Ember `#EE4B1A`.** Max three colors on any single slide (surface + ink + one accent/tint). Ember never touches body copy.
> - **Type:** Sora (display), Inter (body/UI), JetBrains Mono (code/eyebrow/counter), EB Garamond (signature serif — issue numbers, series labels, pull-quotes only). Max two weights per slide.
> - **8px grid.** Every gap/padding/margin is a canonical token from §7. Never invent intermediates.
> - **One idea per slide. One accent word per headline. One visual focus per viewport.**
> - **No AI slop:** no multi-hue gradients, no bouncy springs, no `#000`/`#fff` surfaces, no hand-rolled SVG icons, no centered body paragraphs, no emoji inline with body copy, no drop-shadow on the brand mark.
>
> Before generating, ask: topic, slide count, hook angle. Run the §19 AI checklist before returning output.
>
> **Skill gate:** if the `design-taste-frontend` skill is available in your environment, load it BEFORE building any carousel or slide. Apply its anti-slop rules (copy self-audit, no fake-precise numbers, no decorative dots, no em-dash in slide copy, real-content-over-decoration) on top of this system. Where the two conflict, THIS file wins — Vour's locked signatures (per-slide mono eyebrow, page counter, Iconify `lucide:*` icons, Inter body, EB Garamond stamps) are brand law, not AI tells.

---

# 1 · Brand Personality

**Vour is what a senior engineer's notebook would look like if it were designed by a magazine.**

### Personality (six words)
**Minimal. Confident. Technical. Editorial. Warm. Precise.**

| Trait | What it means visually |
|---|---|
| **Minimal** | Nothing on the slide that isn't carrying meaning. Whitespace is a feature, not leftover space. |
| **Confident** | Big type, decisive hierarchy, no hedging. One idea stated plainly and large. |
| **Technical** | Monospace for machine truth, real diagrams over decorative icons, correct terminology. |
| **Editorial** | Reads like a print magazine spread — eyebrow, headline, lede, one focal image. Asymmetric, left-aligned, generous. |
| **Warm** | Cream paper and warm ink, never clinical blue-gray. Vour is human, not corporate. |
| **Precise** | Everything on an 8px grid. Pinned type sizes. No approximations. |

### Visual language
A **warm editorial surface** (cream paper) carrying **cold technical objects** (terminals, diagrams, code) rendered in **warm ink**. The tension between the human paper and the machine content *is* the brand. A single **ember** accent points the eye to exactly one thing per slide.

### Design philosophy
> **Content is the decoration.** A terminal, a diagram, a real number — those are the visuals. We never add ornament to make a slide "look designed." The design job is hierarchy and restraint, not embellishment.

North stars: **Linear** (restraint + precision), **Vercel** (contrast + type scale), **Stripe** (clarity of technical explanation), **Framer** (motion sensibility), **Apple** (whitespace confidence), **Figma** (friendly technical). Vour = these, but on warm paper instead of cold black.

**What Vour is NOT:** a Canva template, an AI-generated carousel, a generic IG slide, a startup pitch deck, a neon "tech" aesthetic.

---

# 2 · Color System

Vour runs on **two surfaces and one accent**. Everything else is a supporting neutral or a semantic tint used sparingly.

### 2.1 · The rule that governs color
> **Max three colors visible on any slide: one surface + ink + one accent (Ember, or a single topic tint).** If you want a second bright color, you've made a mistake — split the idea across two slides.

### 2.2 · Primary — Ember (the accent)

| Token | Hex | Use |
|---|---|---|
| `--ember` | `#EE4B1A` | THE accent. Eyebrow text, headline keyword (`<span class="a">`), numbered badge, active diagram node, key metric. Points to one thing per slide. |
| `--ember-bright` | `#FF6A3D` | Ember on the Ink surface (brighter for contrast on dark). Use only on dark. |
| `--ember-soft` | `#F5895F` | Hover / secondary emphasis / soft fills. Rare. |
| `--ember-wash` | `rgba(238,75,26,0.06)` | Corner halo on Paper, faint tint wells. |

**Ember law:** never on body paragraphs, never as a border thicker than a callout edge, never in a gradient with another hue.

### 2.3 · Surfaces

| Token | Hex | Surface | Use |
|---|---|---|---|
| `--paper` | `#FBF6EF` | **Paper (light)** | Default slide background. Warm cream, never `#FFF`. |
| `--paper-raised` | `#FFFDF9` | Paper | Cards/panels that lift off the page. |
| `--paper-sunken` | `#F2EADD` | Paper | Corner-halo gradient stop, sunken wells, inactive fields. |
| `--ink-900` | `#14110E` | **Ink (dark)** | Dark-surface slides, terminals, dark callouts. Warm near-black, never `#000`. |
| `--ink-800` | `#1F1A15` | Ink | Raised card on a dark surface. |
| `--ink-700` | `#2B241D` | Ink | Borders/dividers on a dark surface. |

**Two surfaces, one system.** Most decks live on Paper. Ink appears for terminals, code, dark callouts, and the occasional full-dark "engineering" slide for rhythm (§13). Never invent a third surface (no gray, no gradient page).

### 2.4 · Text / Ink neutrals (on Paper)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1C0A05` | Display + headline. Warm near-black. |
| `--ink-soft` | `#3D2419` | Sub-headline + body. |
| `--ink-muted` | `#6E4B3E` | Caption, page counter, secondary body. |
| `--ink-faint` | `#A48C7E` | Inactive labels, disabled, "SCRAPED". |

### 2.5 · Text neutrals (on Ink surface)

| Token | Value | Use |
|---|---|---|
| `--cream` | `#F7F1E8` | Primary text on dark. |
| `--cream-soft` | `rgba(247,241,232,0.72)` | Body on dark. |
| `--cream-muted` | `rgba(247,241,232,0.45)` | Captions / comments on dark. |

### 2.6 · Card tints (topic surfaces — backgrounds only, never text)

| Token | Hex | Topic |
|---|---|---|
| `--card-peach` | `#FBE9D9` | Neutral / default / "the way" |
| `--card-mint` | `#E3F1E1` | Success / growth / "yes" |
| `--card-sky` | `#DEEAF7` | Tooling / info / infra |
| `--card-pink` | `#F7DDE6` | Design / UI / content |
| `--card-amber` | `#FBE7B0` | Performance / speed / highlight |
| `--card-stone` | `#EDE7DA` | Warning / inactive / "no" / loser |

### 2.7 · Semantic line colors (diagram strokes + labels only)

| Token | Hex | Meaning |
|---|---|---|
| `--line-ink` | `#1C0A05` | Default node border + connector |
| `--line-mint` | `#4E9E5C` | Success / winner |
| `--line-sky` | `#2F6EBC` | Tooling / info |
| `--line-amber` | `#B98A0D` | Highlight / perf |
| `--line-pink` | `#C1547B` | Design / content |
| `--line-red` | `#C13B1A` | Warning / loser |
| `--line-muted` | `#A48C7E` | Dashed connectors, faint labels |

### 2.8 · Borders

| Token | Value | Use |
|---|---|---|
| `--hairline` | `rgba(28,10,5,0.10)` | Row dividers, subtle separation on Paper |
| `--border` | `rgba(28,10,5,0.14)` | Card/mockup outline on Paper |
| `--hairline-dark` | `rgba(247,241,232,0.10)` | Dividers on Ink |
| `--border-dark` | `rgba(247,241,232,0.16)` | Card outline on Ink |

### 2.9 · Constraint rules
- `--ember` **never** on body text or on any card tint text.
- Card tints **never** used as text color — background fills only.
- Semantic line colors apply to **node borders + labels**, never as full fills (that role belongs to Ember alone).
- Never place two card tints of different hue on the same slide (breaks the 3-color law).

---

# 3 · Typography System

Four families, four jobs. **Max two weights on a single slide.**

| Role | Family | Weights | Job |
|---|---|---|---|
| **Display** | `Sora` | 600 / 700 / 800 | Hero titles, section titles, big numbers |
| **Body / UI** | `Inter` | 400 / 500 / 600 | Body, captions, labels, card text |
| **Code / Machine** | `JetBrains Mono` | 400 / 500 / 600 | Code, eyebrows, page counter, data, terminal |
| **Signature serif** | `EB Garamond` | 400 / 500 (italic) | Issue numbers, series labels, pull-quote body/glyph — **signature elements only (§16)** |

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=EB+Garamond:ital,wght@1,500&display=swap">
```

### 3.1 · The scale (pinned — do not interpolate)

Battle-tested for the 1080×1350 canvas. Use these literal numbers.

| Token | px | Weight | LH | Family | Role |
|---|---:|---:|---:|---|---|
| `--fs-hero` | **128** | 800 | 0.98 | Sora | Cover / big-number headline |
| `--fs-title` | **104** | 800 | 1.02 | Sora | Inner slide headline |
| `--fs-title-sm` | **88** | 800 | 1.04 | Sora | Compact headline (mockup/diagram slides) |
| `--fs-numeral` | **640** | 800 | 0.85 | Sora | NumeralHero display count |
| `--fs-h2` | **56** | 700 | 1.10 | Sora | Card / row heading |
| `--fs-h3` | **40** | 700 | 1.15 | Sora | Small heading, checklist row |
| `--fs-lead` | **40** | 500 | 1.30 | Inter | Lede under a hero |
| `--fs-body-lg` | **32** | 500 | 1.40 | Inter | Slide body copy |
| `--fs-body` | **28** | 500 | 1.45 | Inter | Card body, bullet body |
| `--fs-eyebrow` | **24** | 500 | 1.0 | JetBrains Mono | Eyebrow, ALL CAPS, tracking 0.18em |
| `--fs-counter` | **24** | 400 | 1.0 | JetBrains Mono | `01 / 10` page counter |
| `--fs-caption` | **22** | 500 | 1.35 | Inter | Sources, micro-meta |
| `--fs-quote` | **64** | 500 | 1.25 | EB Garamond italic | Pull-quote body |

### 3.2 · Hierarchy rules
- **At most ONE element per slide ≥ `--fs-title` (104).** Everything else drops ≥ 24px (one full step).
- Headline tracking: `-0.025em`. Body tracking: `0`. Eyebrow tracking: `0.18em`. Mono counter: `0`.
- **Headline emphasis:** exactly one accent word in `--ember`, wrapped `<span class="a">…</span>`. Never underline, never italic for emphasis (italic belongs to EB Garamond signature use only).
- Numbers in stats/metrics use Sora 800 (`--fs-numeral` / `--fs-h2`), never mono.

### 3.3 · Per-role summary
- **Hero Title** — Sora 800, 128px, one ember word, ≤ 4 words total.
- **Section Title** — Sora 800, 104px inner / 88px on mockup slides.
- **Body** — Inter 500, 32px, `--ink-soft`, left-aligned, ≤ 2 lines in intros.
- **Caption** — Inter 500, 22px, `--ink-muted`.
- **Code** — JetBrains Mono 500, 28px, on Ink surface only.
- **Highlight** — one word Sora 800 in `--ember` inside a headline; OR a EB Garamond italic word for editorial contrast (rare).
- **Number** — Sora 800, `--ember` for the hero figure, `--ink` for unit + caption.

---

# 4 · Grid System

- **Canvas:** `1080 × 1350` (4:5). Instagram + TikTok photo carousels both render 4:5. Never build 9:16 — it crops.
- **Outer padding (safe area):** `80 / 96 / 80` (left+right / top / bottom). Nothing except a deliberate full-bleed image crosses this box.
- **Content column:** `1080 − 160 = 920px` wide working area.
- **Baseline:** everything on the **8px grid**. Optical exceptions must be commented with WHY.
- **Alignment:** **left-aligned by default.** Centered layout is reserved for Cover, Quote, and Outro slides only.
- **Whitespace target:** roughly **40% text / 30% whitespace / 30% visual** by area per slide. Whitespace is the premium signal — protect it.
- **One focal column.** Content flows top→bottom in a single column; two columns only for explicit comparison/split layouts.

Canonical spacing tokens live in §7 and §17. Never invent intermediate gaps.

---

# 5 · Visual Components

Every component shares one language: **warm surface, hairline or no border, generous inner padding, radius from the token scale, mono for machine text, one accent max.** No component uses `backdrop-filter` (it does not survive screenshot export).

### 5.1 · Window chrome (shared base for Terminal / Browser / Mac Window)
```
radius:        20 (mac/terminal) · 24 (browser)
border:        1.5–2px --border (on Paper) / --border-dark (on Ink)
shadow:        0 24px 60px rgba(28,10,5,0.08)
title bar:     20–24 padding
traffic dots:  14px · #FF5F56 / #FFBD2E / #27C93F · 8 gap
```

| Component | Spec |
|---|---|
| **Terminal** | Ink-900 body. Mac dots. `<pre>` JetBrains Mono 28/1.6. Syntax classes: `.cmt` `rgba(247,241,232,.45)` · `.key` `#E8B4A0` · `.val` `#B79CF2` · `.kw` `--ember-bright` · `.num` `#7FD0A0`. Footer divider 1px `--hairline-dark`. Cap 8 lines, ≤ 44 chars/line. |
| **Browser Window** | Paper chrome `#FAF4EA` + `--paper-raised` content. URL pill mono 20 in `--ink-muted`. Optional 260px sidebar. Never paste a real screenshot into the content area — rebuild it in-brand. |
| **Mac Window** | Same base; title-bar label Inter 500 · 22 · `--ink-muted`. For IDE / native-app mockups. |
| **Dashboard Card** | `--paper-raised`, radius 24, `--border`, padding 32. Optional `BigStat` inside. |
| **Code Block** (inline, on Paper) | `--ink-900` panel, radius 16, padding 24, no chrome. For short snippets that don't need a full terminal. |
| **API Flow** | `.diag-flow` — row of `.node` + `→` arrow, exactly one `.node.filled` (ember) as the focus step. |
| **Database** | `.node` with a stacked-cylinder lucide/line-art glyph; label mono 22. Connect via dashed 1.5 `--line-muted`. |
| **Folder Structure** | Monospace tree (`├─ └─ │`) in JetBrains Mono 26, `--ink-soft`; active path row in `--ember`. On `--paper-raised`, radius 16, padding 32. |
| **Git Branch** | Horizontal commit dots (10px) on a 2px `--line-ink` line; branch line curves off at 1.5px; merge node filled `--ember`. Labels mono 20. |
| **Terminal Prompt** | Single line: `--ember` `❯` glyph + JetBrains Mono 28 command. Cursor block optional. |
| **AI Workflow** | `.diag-flow` or `.diag-hub` where one node is an "AI" node (`.node.filled` ember) with line-art spark glyph; inputs left, outputs right. |
| **Architecture Diagram** | `.diag-hub` / layered `.node` stack; layers separated by `--gap-section`; one highlighted layer only. |
| **Node Graph** | `.diag-icon-hub` — `.node.filled.big` centre + 4 line-art icons, dashed `6 6` connectors. |
| **Status Badge** | Pill, radius 999, padding `6 16`, mono 20 CAPS. States: neutral (`--card-stone` bg / `--ink-muted`), active (`--card-mint` / `--line-mint`), alert (`--card-stone` / `--line-red`). |
| **Notification Toast** | `--paper-raised`, radius 16, `--border`, padding `20 24`, left icon-tile 40px, one line title + one line body. Shadow as window base. |
| **Command Palette** | `--ink-800` panel, radius 16, top mono input row with `--ember` caret, list rows mono 26, active row `--ink-700` fill. Cap 5 rows. |

### 5.2 · The diagram primitive — `.node`
Every diagram is built from `.node` (a line-art rounded rectangle):
```
padding:       14 24
min-height:    64
background:    --paper-raised (light) / --ink-800 (dark)
border:        1.5 solid --line-ink
radius:        16
font:          JetBrains Mono 500 · 26
```
Variants: `.filled` (ember bg, cream text, Sora 700) · `.big` (Sora 700 · 44, radius 20, min-height 96 — hub centres) · `.mint`/`.sky`/`.amber`/`.pink`/`.red` (topic-accent **border + text**, never full fill).

**Diagram hard rules:** one highlighted node per diagram · strokes 1.5px (2px emphatic) · dashed connectors `stroke-dasharray: 6 6` · never bleed past the 920px safe column · one diagram per slide.

---

# 6 · Icon Style

**One set, one weight, one rule.**

- **Style:** **outline (line), 2px stroke, rounded joins/caps.** Never filled, never duotone, never hand-rolled.
- **Concept icons:** `lucide:*` — 24×24, color `--ember`, always inside an opaque icon tile.
- **Brand logos:** `simple-icons:*` (`nextdotjs`, `react`, `angular`, `typescript`, `tailwindcss`, `nodedotjs`, `mongodb`, `vercel`) — always inside an editorial icon card, never bare on paper.
- **Loader:** `<script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>`

### Pinned icon sizing
| Container | Container | Glyph |
|---|---:|---:|
| Editorial card icon | 48 × 48 (radius 12) | 24 × 24 |
| Callout icon | 40 × 40 (radius 10) | 24 × 24 |
| Numbered step badge | 40 × 40 | 22 digit |
| Toast icon tile | 40 × 40 | 22 |

**Icon-tile law:** every icon sits on an opaque tile (`--icon-tile-bg: rgba(28,10,5,0.06)` on Paper; `rgba(247,241,232,0.08)` on Ink). No icon ever floats directly on the paper halo. **Consistency:** all icons on a slide are the same set + same size — never mix lucide filled and outline, never mix icon sizes in one row.

---

# 7 · Card Style + Spacing Tokens

### 7.1 · Card spec
| Property | Value |
|---|---|
| **Radius** | `--r-sm 12` (tiles) · `--r 16` (inline blocks) · `--r-lg 20` (callouts/mockups) · `--r-xl 24` (info cards) |
| **Border** | none on tinted cards; `1.5px --border` on `--paper-raised` cards + all mockups |
| **Shadow** | none on flat tinted cards; `--shadow-card: 0 24px 60px rgba(28,10,5,0.08)` on raised/mockup cards only |
| **Elevation** | Paper (0) → tinted card (0, color-lifted) → raised card (shadow) → window/mockup (shadow + border) |
| **Glass** | ❌ not used — `backdrop-filter` fails on export. "Lift" comes from `--paper-raised` + shadow, not blur. |
| **Gradient** | only the corner halo (single-hue ember wash) + optional 1-stop vertical darken inside Ink terminals. Never multi-hue. |
| **Hover** | web/UI contexts only: `translateY(-2px)` + shadow deepen, 160ms. Carousels are static — no hover. |

### 7.2 · Canonical gaps (8px grid — never invent intermediates)
| Token | px | When |
|---|---:|---|
| `--gap-tight` | 8 | Sibling labels, tile inner |
| `--gap-sm` | 16 | Bullets, logo→wordmark, card-to-card in a pair |
| `--gap-badge-headline` | 24 | ★ Eyebrow → headline |
| `--gap-headline-body` | 32 | ★ Headline → body/lede |
| `--gap-body-asset` | 40 | Body → asset/cards row |
| `--gap-section` | 48 | Section → section |
| `--gap-block` | 64 | Header → main body |

### 7.3 · Canonical padding
| Token | px | Where |
|---|---:|---|
| `--pad-x` | 80 | Left + right edge |
| `--pad-top` | 96 | Top edge |
| `--pad-bottom` | 80 | Bottom edge |
| `--pad-card` | 32 | Inside info cards / steps |
| `--pad-callout` | 32 | Inside dark callouts |
| `--pad-window` | 40 | Inside terminals / code |

### 7.4 · The canonical vertical stack
```
Page counter
   ↓ 64  (--gap-block)   [48 on mockup/diagram slides]
Eyebrow
   ↓ 24  (--gap-badge-headline)
Headline
   ↓ 32  (--gap-headline-body)
Body / lede
   ↓ 40  (--gap-body-asset)
Cards / asset / diagram
   ↓ 48  (--gap-section)
Next section / footer
```
Any deviation must state WHY in a comment.

---

# 8 · Background System

**Two surfaces, five treatments.** Treatments never combine (one per slide) and never add multi-hue color.

| Treatment | Surface | Recipe | Use |
|---|---|---|---|
| **Paper (default)** | Paper | `--paper` + single-corner ember halo | 70% of slides |
| **Paper + halo** | Paper | two radial ember stops ≤ 6% opacity (see below) | covers/outros |
| **Ink** | Ink | flat `--ink-900` | terminals, dark callouts, one "engineering" rhythm slide per deck |
| **Blueprint** | Ink | `--ink-900` + 40px grid of `rgba(247,241,232,0.05)` 1px lines | architecture/diagram feature slide (max 1 per deck) |
| **Terminal** | Ink | `--ink-900` + faint top-edge lighten `rgba(247,241,232,0.03)` | full-slide terminal |

```css
/* Paper + halo (the signature background) */
background:
  radial-gradient(55% 40% at 100% 0%, rgba(238,75,26,0.06), transparent 65%),
  radial-gradient(60% 50% at 10% 100%, rgba(238,75,26,0.04), transparent 70%),
  #FBF6EF;
```

**Forbidden backgrounds:** ❌ mesh gradients ❌ noise textures over text ❌ multi-hue gradients ❌ neon/synthwave ❌ pure `#000`/`#fff` ❌ full-page grid on Paper (grid is an Ink-only "blueprint" treatment). The halo maxes at 6% so text is always legible.

---

# 9 · Illustration Style

**One illustration language: line-art on surface, ink stroke, one accent fill.** Never stock illustrations, never 3D renders, never gradient blobs, never photorealism.

| Rule | Value |
|---|---|
| Stroke | 2px subject · 1.75px detail · 1.5px connectors |
| Fill | none, or a single flat `--ember` / topic-tint on small badges |
| Corners | rounded joins + caps (matches icon style) |
| Connectors | dashed `6 6`, `--line-muted` or `--line-ink` |
| Labels | JetBrains Mono 22 CAPS in pill callouts (radius 999, 1.5px border) |

Vocabulary (all rebuildable as SVG/CSS, never imported art): **Flow · Architecture · Pipeline · Cloud · API · Server · Component Tree · Request/Response · Folder · Node Graph**. Each maps to a §5 component or `.node` diagram — illustration = the same primitives, arranged to depict a system. If it can't be drawn from `.node` + line-art, it doesn't belong in a Vour slide.

---

# 10 · Carousel Layout Library (18 templates)

Each template is a distinct hierarchy. Alternate them (see §13). One idea per slide always holds.

| # | Layout | Hierarchy | Best for |
|---:|---|---|---|
| **A** | **Hero Cover** | Huge title (128) · small subtitle · brand mark · bottom eyebrow | Slide 1 |
| **B** | **Question → Keyword** | Small question eyebrow · huge one-word ember keyword · one-line answer | Hook slides |
| **C** | **Split** | 1fr / 1fr — text column + mockup/image column | Concept + evidence |
| **D** | **Numeral Hero** | Massive numeral (640) · headline underneath · one-line context | "N reasons/tools" |
| **E** | **Timeline** | Two date cards side-by-side (stone → peach) | then/now, history |
| **F** | **Comparison** | Two panels (loser dim / winner ember) OR stacked SCRAPED→DESIGNED | before/after, X vs Y |
| **G** | **Checklist** | Eyebrow · headline · vertical mint-tick list (≤ 5) | recap, "you now know" |
| **H** | **Architecture** | Compact headline · full-width `.diag-hub`/layered diagram · optional catatan | system explainers |
| **I** | **Code Highlight** | Compact headline · one-line desc · full-width terminal | code/config/query |
| **J** | **Quote** | EB Garamond ember quote-mark · centered pull-quote · attribution eyebrow | testimonial, expert claim |
| **K** | **Big Stat** | One giant number (ember) · unit · caption | benchmark, metric |
| **L** | **Numbered Steps** | Eyebrow · headline · 3 numbered step cards | how-to, sequence |
| **M** | **Card Grid** | Eyebrow · headline · 2×2 tinted info cards | feature set, options |
| **N** | **Annotated Illustration** | Hero line-art subject · dashed pins to labeled callouts | anatomy, architecture |
| **O** | **Command / Catalog List** | Eyebrow · headline · mono rows (`/cmd → desc`) ≤ 6 | slash-commands, tool list |
| **P** | **Prompt Card** | "COPY THIS" ember-border mono card ≤ 180 chars | steal-this-prompt |
| **Q** | **Data Table** | ✗/✓ 2-column table ≤ 4 rows (red/mint headers) | don't/do, myth/reality |
| **R** | **Editorial Outro** | Big claim · 2–3 short lines · highlight panel · brand mark | final slide / CTA |

**Cover vs Outro:** Cover = Layout A or D. Outro = Layout R (never a stack of CTA discs; one highlight panel).

---

# 11 · Cover Rules (scroll-stoppers)

The cover does one job: **stop the thumb.**

| Rule | Value |
|---|---|
| **Max words** | Headline ≤ 4 words / ≤ 30 chars. Subtitle ≤ 8 words. Eyebrow ≤ 3 words. |
| **Contrast** | Max ink-on-paper contrast. The ember keyword is the single hottest point on the slide. |
| **Hierarchy** | Exactly one dominant element: the 128px hero title (or the 640px numeral). Everything else is ≥ 24px smaller. |
| **Keyword emphasis** | One ember word only. It should be the *specific* / surprising word, not a filler word. |
| **Visual balance** | Left-aligned title, brand mark top or bottom, weight anchored bottom-left. Asymmetric, not centered blocks. |
| **Negative space** | ≥ 35% of the cover is empty paper. Crowded covers read as Canva. |
| **Image usage** | Optional single mockup/`ImagePlate`, never behind the title. If used, it supports — the title still dominates. |
| **Typography scale** | Hero 128 (or numeral 640). Never two large type sizes competing on a cover. |

**Cover anti-patterns:** ❌ full-bleed photo with text overlaid ❌ two accent colors ❌ centered paragraph ❌ more than one focal object ❌ decorative shapes.

---

# 12 · Editorial Rules

**Avoid, always:**
- Walls of text — body ≤ 2 lines in intros, ≤ 3 in cards.
- More than 3 colors on a slide.
- Centered paragraphs (center only Cover / Quote / Outro).
- Random icons — every icon names a real concept, one set, one size.
- Random gradients — only the single-hue corner halo.
- Random decoration — no shapes/lines/dots that don't carry meaning.
- Emoji inline with body copy.
- More than two font weights per slide.
- Two competing focal points — split into two slides.

**Do, always:** left-align, one idea per slide, one ember word per headline, whitespace as structure, mono for machine truth, real diagrams over decoration.

---

# 13 · Visual Rhythm

A deck reads as a magazine when consecutive slides *don't* repeat.

- **Alternate layout families.** Never two of the same layout (§10) back-to-back. Pattern a strong deck: `A (cover) → B/D (hook) → text → mockup → comparison → text → checklist → R (outro)`.
- **Alternate surface.** Insert **one Ink slide** (terminal or dark callout) around the middle for contrast rhythm — but max ~1 dark surface per 3 slides; the deck stays predominantly Paper.
- **Alternate density.** Big-type slide → dense diagram slide → breathing quote slide. Never three dense slides in a row.
- **Alternate visual object.** Terminal → diagram → stat → list → image. Don't reuse the same component twice running.
- **Consistency anchors that never change:** page counter position, eyebrow style, ember accent, brand mark, padding box, type scale. Variety lives in *layout + component + density*, never in *color, type, or spacing*.

---

# 14 · Content Hierarchy

Every deck is one narrative arc:
```
HOOK        →  cover + question. Create tension. (Layouts A/B/D)
CONTEXT     →  why it matters, the stakes. (text)
EXPLANATION →  the concept, shown with a diagram/terminal. (H/I/N)
EXAMPLE     →  concrete proof — code, stat, before/after. (F/I/K)
TAKEAWAY    →  the checklist / one-line lesson. (G)
CTA         →  editorial outro + brand mark. (R)
```
Per slide, the micro-hierarchy is fixed: **counter → eyebrow → headline → body → asset → (catatan)**. One idea per slide; if a slide serves two arc-stages, split it.

---

# 15 · Motion System (future-proof)

Carousels export as static images — motion applies to web/app/video adaptations. Principles keep future motion on-brand.

| Principle | Value |
|---|---|
| **Character** | Precise and calm. Ease, never bounce. No spring overshoot, no elastic. |
| **Entrance** | Fade + rise: `opacity 0→1`, `translateY 12px→0`. |
| **Exit** | Fade + fall: reverse, faster than entrance. |
| **Timing** | `--dur-fast 120ms` (micro) · `--dur 200ms` (standard) · `--dur-slow 320ms` (page/section). |
| **Easing** | `--ease-out: cubic-bezier(0.16,1,0.3,1)` (entrances) · `--ease: cubic-bezier(0.4,0,0.2,1)` (standard). |
| **Movement** | Small. ≤ 16px translate. Content settles, never travels far. |
| **Direction** | Reading direction — content enters from below/right, in stagger (40ms) top→bottom. |
| **Opacity** | Fade paired with every move; never a hard cut on entrance. |
| **Scale** | `0.98→1` max on emphasis. Never `1→1.1` hover pop. |
| **Micro-interactions** | Ember underline sweep on links; caret blink in terminals; one accent element may pulse ≤ 4% scale. |

Forbidden: bouncy springs, rotate-on-hover, parallax on text, auto-playing loops that distract from copy.

---

# 16 · Signature Elements

The subtle, recognizable marks that say "Vour" before anyone reads a word.

| Element | Spec |
|---|---|
| **Brand disc** | Square logo masked into a 72px disc (cover/outro), 44px (inner pill), 40px (in-card min). `background: #07070e`, `object-fit: cover`. Never re-render as letters/SVG, never recolor/stroke/shadow/rotate, never < 40px. |
| **VOUR wordmark** | Sora 700, tracking `0.02em`, `--ink`. Paired with the disc at 16px gap in outro. |
| **The ember accent word** | Exactly one `<span class="a">` per headline. The system's signature gesture. |
| **Mono eyebrow** | JetBrains Mono 24, ALL CAPS, tracking 0.18em, `--ember`. Above every headline. |
| **Page counter** | `01 / 10`, JetBrains Mono 24, `--ink-faint`, top-left, every non-cover slide. |
| **Corner halo** | Single-corner ember wash. Present on every Paper slide — the ambient brand tint. |
| **Series stamps** (EB Garamond) | `Issue #001` · `Deep Dive` · `Blueprint Mode` · `Labs` · `Engineering Notes` · `Dev Breakdown` · `Architecture Series`. Set in **EB Garamond italic 500**, `--ink-muted` (or `--ember` for the active series), small (24–28px), top-right or as the eyebrow's kicker. This serif tag is the editorial "magazine masthead" signal — used sparingly, one per deck. |
| **Catatan panel** | Bottom-of-diagram takeaway: 1.5px `--ember` border, radius 16, label mono "CATATAN" in ember + one-line Sora 700 lesson ≤ 60 chars. Max one per slide. |

**Branding is subtle by design** — the disc + ember word + mono eyebrow + halo do the recognizing. Never a watermark, never a repeated logo pattern.

---

# 17 · Design Tokens

Full token set. Regenerate `tokens/*.css` from this. JSON mirror follows for tooling.

```css
:root{
  /* ── Color · accent ── */
  --ember:#EE4B1A; --ember-bright:#FF6A3D; --ember-soft:#F5895F; --ember-wash:rgba(238,75,26,.06);
  /* ── Color · surfaces ── */
  --paper:#FBF6EF; --paper-raised:#FFFDF9; --paper-sunken:#F2EADD;
  --ink-900:#14110E; --ink-800:#1F1A15; --ink-700:#2B241D;
  /* ── Color · text on paper ── */
  --ink:#1C0A05; --ink-soft:#3D2419; --ink-muted:#6E4B3E; --ink-faint:#A48C7E;
  /* ── Color · text on ink ── */
  --cream:#F7F1E8; --cream-soft:rgba(247,241,232,.72); --cream-muted:rgba(247,241,232,.45);
  /* ── Color · card tints ── */
  --card-peach:#FBE9D9; --card-mint:#E3F1E1; --card-sky:#DEEAF7;
  --card-pink:#F7DDE6; --card-amber:#FBE7B0; --card-stone:#EDE7DA;
  /* ── Color · semantic lines ── */
  --line-ink:#1C0A05; --line-mint:#4E9E5C; --line-sky:#2F6EBC; --line-amber:#B98A0D;
  --line-pink:#C1547B; --line-red:#C13B1A; --line-muted:#A48C7E;
  /* ── Color · borders + tiles ── */
  --hairline:rgba(28,10,5,.10); --border:rgba(28,10,5,.14);
  --hairline-dark:rgba(247,241,232,.10); --border-dark:rgba(247,241,232,.16);
  --icon-tile-bg:rgba(28,10,5,.06); --icon-tile-bg-dark:rgba(247,241,232,.08);
  /* ── Type · families ── */
  --font-display:'Sora',system-ui,sans-serif;
  --font-body:'Inter',system-ui,sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,monospace;
  --font-serif:'EB Garamond',Georgia,serif;
  /* ── Type · sizes ── */
  --fs-hero:128px; --fs-title:104px; --fs-title-sm:88px; --fs-numeral:640px;
  --fs-h2:56px; --fs-h3:40px; --fs-lead:40px; --fs-body-lg:32px; --fs-body:28px;
  --fs-eyebrow:24px; --fs-counter:24px; --fs-caption:22px; --fs-quote:64px;
  /* ── Spacing (8px grid) ── */
  --gap-tight:8px; --gap-sm:16px; --gap-badge-headline:24px; --gap-headline-body:32px;
  --gap-body-asset:40px; --gap-section:48px; --gap-block:64px;
  --pad-x:80px; --pad-top:96px; --pad-bottom:80px;
  --pad-card:32px; --pad-callout:32px; --pad-window:40px;
  /* ── Radius ── */
  --r-sm:12px; --r:16px; --r-lg:20px; --r-xl:24px; --r-pill:999px;
  /* ── Shadow ── */
  --shadow-card:0 24px 60px rgba(28,10,5,.08);
  --shadow-toast:0 12px 32px rgba(28,10,5,.10);
  /* ── Stroke ── */
  --stroke-node:1.5px; --stroke-emphatic:2px; --stroke-subject:2px;
  /* ── Motion ── */
  --dur-fast:120ms; --dur:200ms; --dur-slow:320ms;
  --ease:cubic-bezier(.4,0,.2,1); --ease-out:cubic-bezier(.16,1,.3,1);
  /* ── Blur (web only — never on carousels) ── */
  --blur-none:0;
  /* ── Opacity ── */
  --op-muted:.72; --op-faint:.45; --op-halo:.06;
}
```

```json
{
  "color": {
    "ember": "#EE4B1A", "ember.bright": "#FF6A3D", "ember.soft": "#F5895F",
    "paper": "#FBF6EF", "paper.raised": "#FFFDF9", "paper.sunken": "#F2EADD",
    "ink.900": "#14110E", "ink.800": "#1F1A15", "ink.700": "#2B241D",
    "ink": "#1C0A05", "ink.soft": "#3D2419", "ink.muted": "#6E4B3E", "ink.faint": "#A48C7E",
    "cream": "#F7F1E8",
    "card": {"peach":"#FBE9D9","mint":"#E3F1E1","sky":"#DEEAF7","pink":"#F7DDE6","amber":"#FBE7B0","stone":"#EDE7DA"},
    "line": {"ink":"#1C0A05","mint":"#4E9E5C","sky":"#2F6EBC","amber":"#B98A0D","pink":"#C1547B","red":"#C13B1A","muted":"#A48C7E"}
  },
  "font": {"display":"Sora","body":"Inter","mono":"JetBrains Mono","serif":"EB Garamond"},
  "fontSize": {"hero":128,"title":104,"titleSm":88,"numeral":640,"h2":56,"h3":40,"lead":40,"bodyLg":32,"body":28,"eyebrow":24,"counter":24,"caption":22,"quote":64},
  "space": {"tight":8,"sm":16,"badgeHeadline":24,"headlineBody":32,"bodyAsset":40,"section":48,"block":64},
  "pad": {"x":80,"top":96,"bottom":80,"card":32,"callout":32,"window":40},
  "radius": {"sm":12,"base":16,"lg":20,"xl":24,"pill":999},
  "shadow": {"card":"0 24px 60px rgba(28,10,5,.08)","toast":"0 12px 32px rgba(28,10,5,.10)"},
  "stroke": {"node":1.5,"emphatic":2,"subject":2},
  "motion": {"durFast":120,"dur":200,"durSlow":320,"ease":"cubic-bezier(.4,0,.2,1)","easeOut":"cubic-bezier(.16,1,.3,1)"},
  "canvas": {"w":1080,"h":1350}
}
```

---

# 18 · Accessibility

| Rule | Value |
|---|---|
| **Contrast** | `--ink` on `--paper` ≈ 15:1. `--cream` on `--ink-900` ≈ 14:1. `--ember` on `--paper` ≈ 4.0:1 — **large text only (≥ 24px)**, never ember body. `--ember-bright` on `--ink-900` for dark. Body text always ≥ 7:1. |
| **Readability** | Body ≥ 28px (well above min), line-length ≤ 60 chars, line-height ≥ 1.4 for body, left-aligned. |
| **Font size** | Nothing below `--fs-caption` (22px). Captions are the floor. |
| **Color blindness** | Never encode meaning by hue alone. Comparison uses position + label ("SCRAPED"/"DESIGNED") + ✗/✓, not red-vs-green alone. Ember is reinforced by size/weight/position. |
| **Spacing** | Touch/tap targets in web adaptations ≥ 44px. Slide elements never crowd below `--gap-sm` (16px). |
| **Text-as-image** | Because carousels export as images, always fill the `vourdev-meta` caption (§ export) so screen-reader/alt users get the content. |

---

# 19 · AI Generation Rules (strict)

The system is executed by AI. These are hard constraints — violating one is a failed slide.

**Color**
1. Never more than **3 colors** on a slide (surface + ink + one accent/tint).
2. `--ember` never on body text, never in a gradient, never doubled with another loud hue.
3. Only two surfaces exist: Paper and Ink. Never invent a third.

**Layout**
4. **Never repeat the same layout (§10) on consecutive slides.**
5. Always one visual focus per slide. If two, split into two slides.
6. Always leave ≥ 30% whitespace. Crowding = fail.
7. Left-align everything except Cover / Quote / Outro.
8. Every gap/padding from §7 tokens — no ad-hoc px.

**Type & copy**
9. Eyebrow ≤ 3 words / ≤ 20 chars. Cover headline ≤ 4 words / ≤ 30 chars. Inner headline ≤ 6 words / ≤ 42 chars. Mockup headline ≤ 8 words / ≤ 60 chars.
10. Body: text-only slide ≤ 22 words / ≤ 140 chars / ≤ 2 lines; mockup slide ≤ 16 words / ≤ 100 chars / ≤ 2 lines.
11. **Conjunction check:** > 1 of `dan/atau/tapi/kalau/karena/soalnya/makanya` in a description = too long. Rewrite as two sentences, keep one.
12. Exactly one `<span class="a">` ember accent word per headline.
13. Max two font weights per slide. Sizes from the §3.1 scale only — never interpolate.
14. If copy doesn't fit, **cut copy — never shrink font, never collapse the 24/32/40 gaps.**

**Components**
15. Every icon on an opaque tile (§6). Every card fill from the tint family or `--paper-raised` — never transparent over paper.
16. One mockup per slide, full width (§5/§10). No `backdrop-filter`. No hand-rolled SVG icons. Iconify only.
17. Terminal ≤ 8 lines. CommandList/CatalogList ≤ 6 rows. DataTable ≤ 4 rows. PromptCard ≤ 180 chars. QuoteInset ≤ 180 chars.
18. Every visual element must carry meaning — **never decorate without purpose.**

**Voice**
19. Casual Indonesian, first-person (`saya`); tech terms stay English; never `kami`; `kamu` only in CTAs. No emoji in body. Arrows are `→` not `->`.

**Output integrity**
20. Every HTML file includes exactly one `<script id="vourdev-meta">` JSON block in `<head>` (title, caption, hashtags) — the export pipeline depends on it. Never omit.

**Per-slide pre-flight (all must pass):** ☐ ≤ 3 colors ☐ one focus ☐ ≥ 30% whitespace ☐ layout differs from previous slide ☐ headline within cap + one ember word ☐ body within cap + conjunction check ☐ icons on tiles ☐ gaps are tokens ☐ meta block present.

---

# 20 · Creative Direction — the Vour Manifesto

> **Vour is the engineer's magazine.**
>
> We believe a carousel about software can be as considered as a Kinfolk spread and as precise as a compiler. So we design on warm paper, not cold black — because developers are people, not terminals. But we fill that paper with real machine truth: actual terminals, real diagrams, honest numbers. The warmth is the voice; the precision is the proof.
>
> We say one thing per slide, and we say it big. We point to exactly one idea with exactly one ember mark, and we let the rest breathe. We never decorate — the terminal *is* the decoration, the diagram *is* the art, the whitespace *is* the design. If a shape isn't carrying meaning, it isn't on the slide.
>
> We are minimal but never cold, technical but never intimidating, editorial but never precious. We look expensive because we are restrained, not because we are loud.
>
> **The test:** after reading a single slide — before the handle, before the logo — a developer should think *"this looks like Vour."* Not because of a watermark. Because of the warm paper, the one ember word, the mono eyebrow, the honest diagram, and the confidence of all that empty space.
>
> That recognition, on every slide, forever — **that is the whole job.**

---

# 21 · Export Contract (pipeline — do not break)

### 21.1 · The `vourdev-meta` block
Every carousel HTML file includes **exactly one** metadata block inside `<head>`, right after the Iconify `<script>`. The GitHub Actions → Buffer pipeline reads it to name the file, queue the post body, and attach hashtags.

```html
<script type="application/json" id="vourdev-meta">
{
  "title": "<the brief's title, from '# Carousel Content — <Title>'>",
  "caption": "<the full # Caption block, verbatim, newlines as \n>",
  "hashtags": ["tag1", "tag2", "tag3", "tag4"]
}
</script>
```

Rules: one per file · `<head>` only · valid JSON (`"` → `\"`, newline → `\n`) · never omit a key (`""` for missing caption, `[]` for missing hashtags) · never skip the block.

### 21.2 · Brand mark asset
Render the mark from `assets/vourdev-logo.jpeg` (or the verbatim base64 in `bundle/DESIGN.md §3a` for standalone bundles). When embedding the base64: paste the **entire** string — it ends in `==` and is ≥ 25,900 chars. A truncated paste decodes to a corrupt half-disc. Pre-flight: every `src="data:image/png;base64,…"` ends in `==`.

### 21.3 · Render constraints
- Slides render at exactly **1080 × 1350** and export as screenshots.
- No `backdrop-filter`, no external assets beyond Google Fonts + Iconify + the brand mark.
- Fonts load from the §3 Google Fonts URL; production print surfaces host local `.woff2`.

---

*Vour Design System v1.0 · "Engineering Editorial" · full rewrite of the legacy editorial-cream system (`DESIGN.legacy-update7.md`). Physics preserved (1080×1350, 8px grid, screenshot-safe, Iconify, §21 export contract); taste elevated (dual surface, four-role type, expanded components/layouts/motion, strict AI rules). `tokens/*.css` regenerated with legacy `--ed-*` aliases; `TEMPLATE-editorial-v3.html` regeneration pending.*
