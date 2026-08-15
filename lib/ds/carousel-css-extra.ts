// Additive carousel styles that must NOT live in the verbatim DS-bundle block
// (lib/ds/carousel-css.ts mirrors the design-system template). Appended after it in assemble.
import {
  VOUR_BLACK,
  VOUR_CHARCOAL,
  VOUR_LINE_DARK,
  VOUR_LINE_LIGHT,
  VOUR_MIST,
  VOUR_MIST_FAINT,
  VOUR_MIST_MUTED,
  VOUR_SLATE,
  VOUR_SLATE_FAINT,
  VOUR_TEAL,
  VOUR_TEAL_DEEP,
  VOUR_WHITE,
} from "@/lib/ds/tokens";

export const carouselExtraCss = String.raw`
  /* ═══ Surface tokens ═══
     A mockup must never name a literal ink/paper colour. Descendant CSS can be
     re-scoped per surface, but an inline style="color:#000000" or an SVG
     fill="#000000" cannot — which is why bigstat's unit and gitbranch's main
     line rendered near-black on the near-black Ink canvas. Templates resolve
     these tokens instead, so one declaration below flips the whole component.

     Interpolated from lib/ds/tokens.ts rather than written as literals: this block
     is the seam where the brand palette enters the deck, so it is the one place that
     must not be able to drift from the token file.

     Defaults are the light-surface values, matching the base palette; the dark block
     re-binds them. Anything reading a token is correct on BOTH surfaces with no
     per-surface rule of its own. */
  section {
    --ms-fg: ${VOUR_BLACK};
    --ms-fg-muted: ${VOUR_SLATE};
    --ms-fg-faint: ${VOUR_SLATE_FAINT};
    --ms-panel: ${VOUR_WHITE};
    --ms-panel-deep: ${VOUR_MIST};
    --ms-line: ${VOUR_LINE_LIGHT};
    --ms-accent: ${VOUR_TEAL_DEEP};
    /* Callout inverts against its surface — that inversion IS the emphasis. */
    --ms-invert-bg: ${VOUR_BLACK};
    --ms-invert-fg: ${VOUR_WHITE};
    --ms-invert-chip: rgba(242, 247, 247, 0.10);
  }
  body section:not(.paper) {
    --ms-fg: ${VOUR_WHITE};
    --ms-fg-muted: ${VOUR_MIST_MUTED};
    --ms-fg-faint: ${VOUR_MIST_FAINT};
    --ms-panel: ${VOUR_CHARCOAL};
    --ms-panel-deep: ${VOUR_BLACK};
    --ms-line: ${VOUR_LINE_DARK};
    --ms-accent: ${VOUR_TEAL};
    --ms-invert-bg: ${VOUR_MIST};
    --ms-invert-fg: ${VOUR_BLACK};
    --ms-invert-chip: rgba(0, 0, 0, 0.08);
  }

  /* Text-only editorial cover: brand-row pinned top, "Geser" pinned bottom,
     lead block optically centered on the 1080×1350 canvas. */
  .cover-editorial .cover-lead {
    margin-top: auto;
    margin-bottom: auto;
    display: flex;
    flex-direction: column;
  }
  .cover-editorial .lede { max-width: 860px; }

  /* v1.0 signature serif — series stamp (DESIGN.md §16). One per deck,
     top-right or as eyebrow kicker. "Deep Dive" · "Engineering Notes" · etc. */
  .series-stamp {
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic; font-weight: 500; font-size: 28px;
    letter-spacing: 0.01em; color: #4A5C5C;
  }
  .series-stamp.active { color: #0F6666; }

  /* Improvised editorial-Ink intro container & ghost spacing */
  /* No height here: "section" already pins 1350px, and a "height:100%" on this
     class outranks it and resolves against a body with no height, collapsing the
     cover to its content. */
  .cover-editorial-ink {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .ce-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  .ce-lead {
    margin-top: auto;
    margin-bottom: auto;
    display: flex;
    flex-direction: column;
    z-index: 10;
  }
  .ce-ghost {
    position: absolute;
    right: -80px;
    bottom: 200px;
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 640px;
    line-height: 0.85;
    color: #50DCDC;
    opacity: 0.06;
    pointer-events: none;
    user-select: none;
    z-index: 1;
  }

  /* ═══ Deck-wide Dark Ink default (matches cover-slides.html) ═══
     Ink is the DEFAULT surface for every slide. carousel-css.ts is DO-NOT-EDIT and
     paints Paper via bare selectors (specificity 0-0-1 / 0-1-0). This file is
     appended AFTER it in assemble.ts, so scoping under "body section" wins on
     specificity + source order WITHOUT !important.

     EVERY ink rule below is scoped ":not(.paper)". That is load-bearing, not
     cosmetic: a bare "body section .node" also matches a section.paper, so a
     cream slide was being handed dark-surface mockups (hub/concept/flow nodes,
     datatable rules, steps, terminal, quote, browser, …) and the mockup no
     longer matched the slide it sat on. Paper is now simply the ABSENCE of these
     rules — it falls through to the DO-NOT-EDIT base, so there is no second copy
     of the cream palette to keep in sync. When adding an ink rule here, scope it
     the same way; do not add a paper counterpart. */
  /* Dark surface. The base is a charcoal-to-black fall rather than one flat black:
     logo black is the floor, VOUR_CHARCOAL carries the teal tint, and the gradient
     between them is what stops a dark slide reading as an unstyled void. */
  body section:not(.paper) {
    position: relative;
    background:
      linear-gradient(rgba(242,247,247,0.03), transparent 220px),
      radial-gradient(130% 90% at 50% 0%, #0D1414, #000000 68%);
    color: #FFFFFF;
  }
  /* Two teal glows, held at 5-10% so they read as light in the room rather than as
     a coloured background. Corner placement is what gives consecutive dark slides
     different centres of gravity. */
  body section:not(.paper)::before {
    content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(60% 42% at 100% 0%, rgba(80,220,220,0.08), transparent 60%),
      radial-gradient(50% 40% at 0% 100%, rgba(77,225,243,0.05), transparent 65%);
  }
  body section > * { position: relative; z-index: 1; }

  /* Text + default elements coloring on the dark canvas. */
  body section:not(.paper) .counter { color: rgba(242,247,247,0.45); }
  body section:not(.paper) .eyebrow { color: #50DCDC; }
  body section:not(.paper) h1 { color: #FFFFFF; }
  body section:not(.paper) h1 .a { color: #50DCDC; }
  body section:not(.paper) .lede,
  body section:not(.paper) .body-text { color: rgba(242,247,247,0.72); }
  body section:not(.paper) .geser { color: rgba(242,247,247,0.45); }

  /* Info cards keep their LIGHT tone background + dark text on ink (they read as
     raised light tiles) — only soften the edge against the dark canvas. */
  body section:not(.paper) .card { box-shadow: 0 24px 60px rgba(0,0,0,0.35); }
  body section:not(.paper) .catatan-body { color: #FFFFFF; }
  body section:not(.paper) .checklist li { color: #FFFFFF; }
  body section:not(.paper) .brand-handle { color: #FFFFFF; }

  /* Panels that are dark BY DESIGN (terminal, command palette) sit only 11 points
     of luminance above the Ink canvas, so on Ink they read as a smudge rather
     than a device. A hairline edge is what separates them from the background. */
  body section:not(.paper) .cmdp {
    border-color: rgba(242,247,247, 0.16);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  }
  body section:not(.paper) .cmdp .search { border-bottom-color: rgba(242,247,247, 0.14); }

  /* Git branch SVG — bound to the surface tokens. CSS beats SVG presentation
     attributes, so these win wherever the template still carries a literal. */
  .git .g-main { stroke: var(--ms-fg); }
  .git .g-dot { fill: var(--ms-fg); }
  .git .g-label { fill: var(--ms-fg-muted); }
  .git .g-feat { stroke: var(--ms-accent); }
  .git .g-fdot { fill: var(--ms-accent); }
  .git .g-flabel { fill: var(--ms-accent); }

  /* ═══ Mockup fit — surface-independent, applies on Paper and Ink alike ═══ */

  /* Flow chain: the row could not wrap and .node forbids wrapping its own text,
     so a 4-5 step flow (labels up to 24 chars) overflowed the 920px content box.
     justify-content:center then split the overflow, clipping the first and last
     node against section{overflow:hidden}. Wrapping keeps every step on canvas. */
  .diag-flow { flex-wrap: wrap; row-gap: 16px; max-width: 100%; }
  .diag-flow .flow-step { display: inline-flex; align-items: center; gap: 20px; max-width: 100%; }
  .diag-flow .node {
    max-width: 100%;
    white-space: normal;
    text-align: center;
    font-size: 24px;
    padding: 14px 20px;
  }

  /* Recap checklist: 40px Sora blew past the canvas once a deck used 5-6 items,
     and a single 48-char item was wider than the content box on its own. */
  .checklist { width: 100%; }
  .checklist li {
    align-items: flex-start;
    font-size: 32px;
    line-height: 1.3;
  }
  .checklist .tick { font-size: 32px; line-height: 1.3; width: 36px; }

  /* ═══ Mockup border/chrome overrides — INK SURFACE ONLY ═══ */
  body section:not(.paper) .browser {
    border-color: rgba(242,247,247, 0.16);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  }
  body section:not(.paper) .b-chrome {
    background: #0D1414;
    border-bottom-color: rgba(242,247,247, 0.14);
  }
  body section:not(.paper) .b-url {
    background: #000000;
    border-color: rgba(242,247,247, 0.16);
    color: rgba(242,247,247, 0.72);
  }
  body section:not(.paper) .b-card {
    background: #0D1414;
    border-color: rgba(242,247,247, 0.14);
  }
  body section:not(.paper) .b-card .t {
    color: #FFFFFF;
  }
  body section:not(.paper) .b-card .s {
    color: rgba(242,247,247, 0.45);
  }

  body section:not(.paper) .terminal {
    border: 1.5px solid rgba(242,247,247, 0.16);
    background: #0D1414;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  }
  body section:not(.paper) .terminal-bar {
    border-bottom: 1px solid rgba(242,247,247, 0.10);
    padding-bottom: 12px;
  }

  body section:not(.paper) .prompt {
    background: #0D1414;
    border-color: #50DCDC;
  }
  body section:not(.paper) .prompt .lbl {
    background: #000000;
    color: #50DCDC;
  }
  body section:not(.paper) .prompt pre {
    color: #FFFFFF;
  }

  body section:not(.paper) .tree {
    background: #0D1414;
    border-color: rgba(242,247,247, 0.16);
    color: rgba(242,247,247, 0.72);
  }

  body section:not(.paper) .db .table {
    border-color: rgba(242,247,247, 0.16);
    background: #0D1414;
  }
  body section:not(.paper) .db .table .th {
    background: #000000;
    color: #FFFFFF;
  }
  body section:not(.paper) .db .table .tr {
    color: rgba(242,247,247, 0.72);
    border-top-color: rgba(242,247,247, 0.10);
  }
  body section:not(.paper) .db .table .tr .ty {
    color: rgba(242,247,247, 0.45);
  }

  body section:not(.paper) .node {
    background: #0D1414;
    border-color: rgba(242,247,247, 0.16);
    color: #FFFFFF;
  }
  body section:not(.paper) .node.filled {
    background: #0F6666;
    border-color: #0F6666;
    color: #fff;
  }

  body section:not(.paper) .step {
    background: #0D1414;
    border: 1.5px solid rgba(242,247,247, 0.14);
  }
  body section:not(.paper) .step-title {
    color: #FFFFFF;
  }
  body section:not(.paper) .step-body {
    color: rgba(242,247,247, 0.72);
  }

  body section:not(.paper) .timeline .tl-card.old {
    background: #0D1414;
    border: 1.5px solid rgba(242,247,247, 0.10);
  }
  body section:not(.paper) .timeline .tl-card.old .d {
    color: rgba(242,247,247, 0.45);
  }
  body section:not(.paper) .timeline .tl-card.old .h {
    color: #FFFFFF;
  }
  body section:not(.paper) .timeline .tl-card.old .t {
    color: rgba(242,247,247, 0.72);
  }

  body section:not(.paper) .dtable {
    border-top-color: rgba(242,247,247, 0.16);
  }
  body section:not(.paper) .dt-row {
    border-top-color: rgba(242,247,247, 0.10);
  }
  body section:not(.paper) .dt-row .c {
    color: rgba(242,247,247, 0.72);
  }
  body section:not(.paper) .dt-row .c.b {
    color: #FFFFFF;
  }

  body section:not(.paper) .clist .row {
    border-top-color: rgba(242,247,247, 0.10);
  }
  body section:not(.paper) .clist .desc {
    color: rgba(242,247,247, 0.72);
  }

  body section:not(.paper) .highlight {
    background: #0D1414;
    border: 1.5px solid rgba(242,247,247, 0.14);
  }
  body section:not(.paper) .highlight .sub {
    color: rgba(242,247,247, 0.72);
  }

  body section:not(.paper) .diag-bars .panel {
    background: #0D1414;
    border-color: rgba(242,247,247, 0.10);
  }
  body section:not(.paper) .diag-bars .panel.loser {
    border-color: rgba(96,114,114, 0.3);
  }
  body section:not(.paper) .diag-bars .panel .foot {
    color: #50DCDC;
  }
  body section:not(.paper) .diag-bars .panel.loser .foot {
    color: #607272;
  }

  body section:not(.paper) .quote-inset {
    background: #0D1414;
    border-left-color: #0F6666;
  }
  body section:not(.paper) .qi-body {
    color: #FFFFFF;
  }

  body section:not(.paper) .mock {
    background: #0D1414;
    border-color: rgba(242,247,247, 0.16);
  }
  body section:not(.paper) .mock-head {
    color: rgba(242,247,247, 0.45);
    border-bottom-color: rgba(242,247,247, 0.14);
  }
  body section:not(.paper) .mock-field {
    background: #000000;
    border-color: rgba(242,247,247, 0.16);
    color: #FFFFFF;
  }

  /* ═══ Cover dark surface — a third background variant, heavier than body dark ═══
     The cover carries more light than an interior slide so the first frame of the
     carousel has more presence in a feed. Every stop stays inside the 5-10% band the
     brand allows; the extra weight comes from a third glow and wider falloff, not from
     turning the opacity up until the background stops being black. */
  section.cover-ink { position: relative; }
  section.cover-ink::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(70% 50% at 100% 0%, rgba(80,220,220,0.10), transparent 62%),
      radial-gradient(60% 46% at 0% 100%, rgba(77,225,243,0.07), transparent 66%),
      radial-gradient(90% 60% at 50% 55%, rgba(80,220,220,0.05), transparent 70%);
  }
  section.cover-ink > * { position: relative; z-index: 1; }
  /* …except the ghost numeral, which must stay out of flow. "section.cover-ink > *"
     (0-1-1) outranks ".ce-ghost" (0-1-0), so without this the numeral is laid out
     as a relative block at the top of the column and eats the cover's free space. */
  section.cover-ink > .ce-ghost { position: absolute; }
  /* Cover anchor wrapper — centers the single visual anchor in the free space */
  .anchor-wrap { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
  .anchor-wrap > * { max-width: 100%; max-height: 100%; }

  /* Scope div for a custom mockup/hook. It exists only to give the fragment's CSS
     a scope root, so it must not behave like a box: it fills its slot and passes
     the centering through, otherwise it shrink-wraps as a flex item and a
     width:100% inside the fragment resolves against the fragment's own content. */
  .diag-wrap > .cm,
  .anchor-wrap > .cm {
    width: 100%; min-height: 0; max-height: 100%;
    display: flex; align-items: center; justify-content: center;
  }
  .diag-wrap > .cm > *,
  .anchor-wrap > .cm > * { max-width: 100%; }

  /* Readable defaults for a sanitized custom fragment.

     sanitizeCustomHtml strips every style= attribute, every <style> block and every
     non-whitelisted class, so a fragment arrives with no appearance of its own. Without
     these rules it would render as browser-default black Times on the Ink canvas —
     invisible, and the reason "just strip the styling" needs a floor under it. Everything
     here reads surface tokens, so it is correct on Ink and Paper with no per-surface rule. */
  .cm-base { flex-direction: column; gap: 16px; text-align: left;
    font-family: 'Inter', system-ui, sans-serif; color: var(--ms-fg);
    font-size: 30px; line-height: 1.45;
    /* The fragment is a panel, not loose text on the canvas. Without this it renders as
       a bare paragraph floating in the diagram well, which reads as a slide that failed
       to render rather than as a deliberate mockup. Every value is a surface token, so
       one rule is correct on both Ink and Paper. */
    width: 100%; padding: 36px 40px;
    background: var(--ms-panel); border: 1.5px solid var(--ms-line);
    border-radius: 20px;
    /* Tinted to the canvas, never pure black — see the shadow note in DESIGN.md. */
    box-shadow: 0 16px 40px rgba(0,0,0, 0.10); }
  /* justify-content:center on .cm would push a short fragment's children apart once
     .cm-base makes it a real box; keep the content stacked from the top. */
  .diag-wrap > .cm.cm-base,
  .anchor-wrap > .cm.cm-base { justify-content: flex-start; align-items: stretch; }
  .cm-base p, .cm-base li, .cm-base td, .cm-base th, .cm-base div, .cm-base span {
    color: var(--ms-fg); font-size: inherit; line-height: inherit; }
  .cm-base h1, .cm-base h2, .cm-base h3, .cm-base h4, .cm-base h5, .cm-base h6 {
    color: var(--ms-fg); font-weight: 700; font-size: 38px; line-height: 1.2; margin: 0; }
  .cm-base strong, .cm-base b { color: var(--ms-accent); font-weight: 700; }
  .cm-base code, .cm-base pre, .cm-base kbd {
    font-family: 'JetBrains Mono', monospace; font-size: 26px;
    background: var(--ms-panel-deep); color: var(--ms-fg);
    border: 1px solid var(--ms-line); border-radius: 8px; padding: 2px 8px; }
  .cm-base pre { padding: 16px 20px; overflow: hidden; white-space: pre-wrap; }
  .cm-base ul, .cm-base ol { margin: 0; padding-left: 32px; display: flex;
    flex-direction: column; gap: 10px; }
  .cm-base table { width: 100%; border-collapse: collapse; }
  .cm-base th, .cm-base td { border: 1px solid var(--ms-line); padding: 12px 16px;
    text-align: left; }
  .cm-base th { font-weight: 700; background: var(--ms-panel-deep); }
  .cm-base img, .cm-base svg { max-width: 100%; height: auto; }
  .cm-base hr { border: 0; border-top: 1px solid var(--ms-line); width: 100%; }

  /* Cover CTA follows the cover-slides.html prototype: the last FLOW child, not an
     absolutely-positioned overlay. carousel-css.ts (DO-NOT-EDIT) pins .geser with
     position:absolute, which takes it out of the column — .anchor-wrap{flex:1} then
     expands through the CTA band and the anchor sits on top of "Geser". Going back
     to static makes the CTA reserve its own band, and its left edge falls on the
     content box (the same 80px grid as the eyebrow and headline) instead of being
     measured separately. */
  section.cover-ink .geser {
    position: static;
    margin-top: 32px;
    /* The cover CTA is the one instruction on the slide — it carries the accent,
       not the muted body tint the inner slides use. */
    color: #50DCDC;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }
  /* Accent rule under the CTA so it reads as a control, not stray copy. */
  section.cover-ink .geser::before {
    content: "";
    width: 56px; height: 2px;
    background: #50DCDC;
    border-radius: 1px;
  }

  /* Cover anchor — ID badge (NOT .badge; that is the step-number badge) */
  .cover-badge { position: relative; width: 560px; padding: 48px 44px 44px; border-radius: 26px;
    background: #0D1414; border: 1.5px solid #162020; transform: rotate(-4deg);
    box-shadow: 0 40px 90px rgba(0,0,0,0.55); }
  .cover-badge .hole { position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
    width: 120px; height: 16px; border-radius: 8px; background: #000000; border: 1.5px solid #162020; }
  .cover-badge .brow { display: flex; align-items: center; gap: 12px; margin-top: 20px;
    font-family: 'JetBrains Mono'; font-size: 22px; color: rgba(242,247,247,0.45); letter-spacing: 0.08em; }
  .cover-badge .role { font-family: 'Sora'; font-weight: 800; font-size: 72px; line-height: 1;
    color: #FFFFFF; margin-top: 22px; }
  .cover-badge .sub { font-family: 'JetBrains Mono'; font-size: 24px; color: rgba(242,247,247,0.45); margin-top: 14px; }
  .cover-badge .cover-strike { position: absolute; left: -10px; right: -10px; top: 56%; height: 12px;
    border-radius: 6px; background: #50DCDC; transform: rotate(-9deg); box-shadow: 0 8px 30px rgba(80,220,220,0.5); }

  /* Cover anchor — NOC status grid */
  .cover-noc { width: 100%; max-width: 840px; }
  .cover-noc .grid { display: grid; gap: 14px; }
  .cover-noc .node { aspect-ratio: 1; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
  .cover-noc .node.down { background: rgba(96,114,114,0.16); border: 1.5px solid #607272; box-shadow: inset 0 0 24px rgba(96,114,114,0.25); }
  .cover-noc .node.up { background: rgba(31,140,110,0.14); border: 1.5px solid #16705A; box-shadow: inset 0 0 24px rgba(31,140,110,0.20); }
  .cover-noc .banner { margin-top: 28px; display: flex; align-items: center; justify-content: center; gap: 14px;
    font-family: 'JetBrains Mono'; font-size: 38px; font-weight: 600; letter-spacing: 0.08em; color: #8FA5A5; }
  .cover-noc .node svg { display: block; }

  /* Cover anchor — Norman door (pull handle contradicts the label) */
  .cover-door { position: relative; width: 340px; height: 460px; border-radius: 16px;
    background: #0D1414; border: 1.5px solid #162020; display: flex; align-items: center; justify-content: flex-end;
    padding-right: 30px; box-shadow: 0 40px 90px rgba(0,0,0,0.55); }
  .cover-door .label { position: absolute; top: 34px; left: 0; right: 0; text-align: center;
    font-family: 'JetBrains Mono'; font-size: 34px; font-weight: 600; letter-spacing: 0.22em; color: #50DCDC; }
  .cover-door .handle { width: 26px; height: 200px; border-radius: 13px; background: #FFFFFF; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .cover-door .hand { position: absolute; right: -6px; top: 50%; transform: translateY(-50%); }
  .cover-door .hand svg { display: block; }

  /* ═══ v1.0 Stage-B mockups — browser · quote · datatable · commandlist · timeline ═══ */

  /* Browser window */
  .browser { width: 100%; border: 1.5px solid #000000; border-radius: 24px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.10); background: #FFFFFF; }
  .b-chrome { background: #F2F7F7; border-bottom: 1.5px solid rgba(0,0,0,0.14);
    padding: 20px 24px; display: flex; align-items: center; gap: 20px; }
  .b-dots { display: flex; gap: 8px; }
  .b-dots i { width: 14px; height: 14px; border-radius: 50%; display: block; }
  .b-dots .r { background: #1F5C5C; } .b-dots .y { background: #2E8F8F; } .b-dots .g { background: #50DCDC; }
  .b-url { flex: 1; background: #F2F7F7; border: 1px solid rgba(0,0,0,0.14); border-radius: 999px;
    padding: 10px 24px; font-family: 'JetBrains Mono'; font-size: 20px; color: #4A5C5C; }
  .b-main { padding: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .b-card { border: 1.5px solid rgba(0,0,0,0.14); border-radius: 16px; min-height: 150px;
    background: #F2F7F7; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
  .b-card .t { font-family: 'Sora'; font-weight: 700; font-size: 40px; color: #000000; line-height: 1.1; }
  .b-card .s { font-family: 'JetBrains Mono'; font-size: 20px; color: #4A5C5C; margin-top: 4px; }

  /* Quote inset (EB Garamond) */
  .quote-inset { width: 100%; border-left: 6px solid #0F6666; background: #E4E9E9;
    border-radius: 4px; padding: 40px 48px; }
  .qi-body { font-family: 'EB Garamond', Georgia, serif; font-style: italic; font-weight: 500;
    font-size: 48px; line-height: 1.35; color: #000000; }
  .qi-author { font-family: 'JetBrains Mono'; font-size: 24px; color: #0F6666; margin-top: 24px;
    letter-spacing: 0.08em; text-transform: uppercase; }

  /* Data table ✗/✓ */
  .dtable { width: 100%; border-top: 1.5px solid #000000; }
  .dt-hr { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; font-family: 'JetBrains Mono';
    font-size: 24px; letter-spacing: 0.1em; text-transform: uppercase; padding: 20px 0; }
  .dt-hr .no { color: #607272; } .dt-hr .ok { color: #16705A; }
  .dt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
    border-top: 1px solid rgba(0,0,0,0.10); padding: 26px 0; }
  .dt-row .c { font-family: 'Inter'; font-size: 28px; line-height: 1.35; color: #223131; }
  .dt-row .c.b { color: #000000; font-weight: 600; }

  /* Command list */
  .clist { width: 100%; display: flex; flex-direction: column; }
  .clist .row { display: flex; align-items: baseline; gap: 32px; padding: 24px 0;
    border-top: 1.5px solid rgba(0,0,0,0.10); }
  .clist .row:first-child { border-top: none; }
  .clist .cmd { font-family: 'JetBrains Mono'; font-size: 34px; color: #0F6666; min-width: 280px; }
  .clist .desc { font-family: 'Inter'; font-size: 28px; color: #223131; }

  /* Timeline (then / now) */
  .timeline { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .tl-card { border-radius: 20px; padding: 36px 32px; }
  .tl-card.old { background: #E4E9E9; }
  .tl-card.new { background: #E2F4F4; border: 2px solid #0F6666; }
  .tl-card .d { font-family: 'JetBrains Mono'; font-size: 22px; letter-spacing: 0.12em;
    text-transform: uppercase; color: #4A5C5C; }
  .tl-card.new .d { color: #0F6666; }
  .tl-card .h { font-family: 'Sora'; font-weight: 700; font-size: 36px; color: #000000; margin-top: 14px; line-height: 1.15; }
  .tl-card .t { font-family: 'Inter'; font-size: 26px; color: #223131; margin-top: 12px; line-height: 1.4; }

  /* ═══ v1.0 TASK-1 mockups — promptcard · foldertree · commandpalette · database · gitbranch ═══ */

  /* Prompt card — copy-paste AI prompt, 2px ember border + corner label */
  .prompt { position: relative; border: 2px solid #0F6666; border-radius: 20px;
    padding: 44px 40px 40px; background: #FFFFFF; }
  .prompt .lbl { position: absolute; top: -16px; left: 32px; background: #F2F7F7; padding: 0 14px;
    font-family: 'JetBrains Mono'; font-size: 20px; letter-spacing: 0.18em;
    text-transform: uppercase; color: #0F6666; }
  .prompt pre { font-family: 'JetBrains Mono'; font-size: 30px; line-height: 1.55;
    color: #000000; white-space: pre-wrap; }

  /* Folder tree — mono directory listing, active row in the brand accent */
  .tree { width: 100%; background: #FFFFFF; border: 1.5px solid rgba(0,0,0,0.14);
    border-radius: 20px; padding: 40px 44px; font-family: 'JetBrains Mono'; font-size: 30px;
    line-height: 1.7; color: #223131; white-space: pre-wrap; }
  .tree .on { color: #0F6666; font-weight: 600; }

  /* Command palette — Cmd+K menu on Ink surface */
  .cmdp { width: 100%; background: #0D1414; border: 1.5px solid #162020; border-radius: 20px;
    overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,0.4); }
  .cmdp .search { padding: 28px 32px; border-bottom: 1px solid #162020;
    display: flex; align-items: center; gap: 16px; }
  .cmdp .search .car { color: #50DCDC; font-family: 'JetBrains Mono'; font-size: 30px; }
  .cmdp .search .q { font-family: 'JetBrains Mono'; font-size: 30px; color: #FFFFFF; }
  .cmdp .row { padding: 22px 32px; display: flex; align-items: center; gap: 20px;
    font-family: 'JetBrains Mono'; font-size: 28px; color: rgba(242,247,247,0.72); }
  .cmdp .row.on { background: #162020; color: #FFFFFF; }
  .cmdp .row svg { flex: none; }
  .cmdp .row .k { margin-left: auto; font-size: 20px; color: rgba(242,247,247,0.45); }

  /* Database — two related tables + relation glyph */
  .db { width: 100%; display: flex; align-items: center; justify-content: center;
    gap: 48px; flex-wrap: wrap; }
  .db .table { border: 1.5px solid #000000; border-radius: 16px; overflow: hidden;
    min-width: 300px; background: #FFFFFF; }
  .db .table .th { background: #000000; color: #FFFFFF; font-family: 'JetBrains Mono';
    font-size: 26px; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
  .db .table .tr { padding: 14px 24px; font-family: 'JetBrains Mono'; font-size: 24px;
    color: #223131; border-top: 1px solid rgba(0,0,0,0.10);
    display: flex; justify-content: space-between; gap: 24px; }
  .db .table .tr .ty { color: #7E9494; }
  .db .rel { font-family: 'JetBrains Mono'; font-size: 28px; color: #0F6666; }

  /* Git branch — fixed 2-branch SVG diagram */
  .git { width: 100%; position: relative; padding: 40px 20px; }
  .git svg { width: 100%; height: 300px; display: block; }

  /* Illustration — unDraw SVG for abstract concepts / analogies.

     Sized by HEIGHT, not by a square box. 123 of the 145 allowlisted illustrations are
     landscape (median viewBox ratio 1.29, up to 2.86), so a fixed
     width:500px + height:500px letterboxed them: a 2.86-ratio drawing became 240×84 floating
     in a 240×240 slot, which reads as "the illustration came out tiny". Pinning the
     height and letting width follow the viewBox gives every slug the same visual weight.

     The height is a CEILING, not a fixed value. align-self:stretch hands
     .diag-illustration the full height of .diag-wrap, which flex has already made
     definite; the group then takes what the caption leaves and max-height:100% clamps
     the drawing to it. A fixed height cannot work here because the space a point slide
     leaves swings with the headline: measured on the real 1080×1350 canvas, .diag-wrap
     is 920×733 under a two-line headline but only 920×459 under a four-line one. The
     previous fixed 440px looked right in the roomy case and, in the tight one, pushed a
     626px block out of a 459px well — overlapping the body text above and running 4px
     off the bottom of the canvas. */
  .diag-illustration { width: 100%; align-self: stretch; min-height: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; padding: 16px 0; }
  /* The caption keeps its natural height; the illustration is what gives way. */
  .diag-illustration > .catatan { flex: none; width: 100%; }

  /* One layout for 1 and 2 illustrations — the count only changes the size class, so
     the single and pair cases cannot drift apart. justify-content:center (NOT
     space-between) keeps a pair together instead of shoving each to an edge. */
  .illustration-group { display: flex; flex-direction: row;
    align-items: center; justify-content: center; gap: 28px; flex-wrap: nowrap;
    width: 100%; flex: 1 1 auto; min-height: 0; }
  .illustration-group .illus-item { display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    flex-shrink: 0; min-width: 0; height: 100%; min-height: 0; }
  .illustration-group .illus-item svg { display: block; flex-shrink: 0;
    width: auto; max-height: 100%; }
  /* max-width caps the panoramas (up to 2.86:1) so they cannot run past the 920px
     content column (1080 canvas − 80px padding per side).

     Single: 500px tall, capped at 900px wide so even a 2.86:1 panorama keeps a 20px
     margin inside the column.

     Pair: the width cap binds first — two items plus the 28px gap must fit 920px, so
     446px each. 420px of height is what a portrait slug can use before that cap takes
     over; a 1.29:1 slug wants 542px at that height and letterboxes down to ~346px
     inside its box. Equal boxes across the pair are worth the letterboxing. */
  .illustration-group.is-single .illus-item svg { height: 500px; max-width: 900px; }
  .illustration-group.is-pair   .illus-item svg { height: 420px; max-width: 446px; }

  /* Screenshot evidence — uploaded real evidence image or pending placeholder */
  .diag-screenshot { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .diag-screenshot img { max-width: 100%; max-height: 480px; width: auto; height: auto; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.18); box-shadow: 0 16px 40px rgba(0,0,0,0.12); object-fit: contain; }
  .diag-screenshot-placeholder { width: 100%; padding: 36px 32px; border: 2px dashed #0F6666; border-radius: 20px; background: rgba(80,220,220,0.04); display: flex; flex-direction: column; gap: 14px; text-align: left; }
  .diag-screenshot-badge { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 22px; color: #0F6666; letter-spacing: 0.08em; text-transform: uppercase; }
  .diag-screenshot-source { font-size: 26px; line-height: 1.4; color: #000000; font-weight: 600; }
  .diag-screenshot-source span { color: #0F6666; }
  .diag-screenshot-brief-item { font-size: 22px; line-height: 1.4; color: #8AA0A0; }
  .diag-screenshot-brief-item strong { color: #000000; }
`;
