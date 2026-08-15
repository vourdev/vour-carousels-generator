// Additive carousel styles that must NOT live in the verbatim DS-bundle block
// (lib/ds/carousel-css.ts is marked DO NOT EDIT). Appended after it in assemble.
export const carouselExtraCss = String.raw`
  /* ═══ Surface tokens ═══
     A mockup must never name a literal ink/paper colour. Descendant CSS can be
     re-scoped per surface, but an inline style="color:#1C0A05" or an SVG
     fill="#1C0A05" cannot — which is why bigstat's unit and gitbranch's main
     line rendered near-black on the near-black Ink canvas. Templates resolve
     these tokens instead, so one declaration below flips the whole component.

     Defaults are the Paper values, matching the DO-NOT-EDIT base palette; the
     Ink block re-binds them. Anything reading a token is correct on BOTH
     surfaces with no per-surface rule of its own. */
  section {
    --ms-fg: #1C0A05;
    --ms-fg-muted: #3D2419;
    --ms-fg-faint: #A48C7E;
    --ms-panel: #FFFDF9;
    --ms-panel-deep: #FBF6EF;
    --ms-line: rgba(28, 10, 5, 0.14);
    --ms-accent: #EE4B1A;
    /* Callout inverts against its surface — that inversion IS the emphasis. */
    --ms-invert-bg: #14110E;
    --ms-invert-fg: #F7F1E8;
    --ms-invert-chip: rgba(255, 255, 255, 0.08);
  }
  body section:not(.paper) {
    --ms-fg: #F7F1E8;
    --ms-fg-muted: rgba(247, 241, 232, 0.72);
    --ms-fg-faint: rgba(247, 241, 232, 0.45);
    --ms-panel: #1F1A15;
    --ms-panel-deep: #14110E;
    --ms-line: rgba(247, 241, 232, 0.16);
    --ms-accent: #FF6A3D;
    --ms-invert-bg: #FDFBF6;
    --ms-invert-fg: #1C0A05;
    --ms-invert-chip: rgba(28, 10, 5, 0.08);
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
    letter-spacing: 0.01em; color: #6E4B3E;
  }
  .series-stamp.active { color: #EE4B1A; }

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
    color: #FF6A3D;
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
  body section:not(.paper) {
    position: relative;
    background: linear-gradient(rgba(247,241,232,0.03), transparent 200px), #14110E;
    color: #F7F1E8;
  }
  body section:not(.paper)::before {
    content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(60% 42% at 100% 0%, rgba(238,75,26,0.16), transparent 60%),
      radial-gradient(50% 40% at 0% 100%, rgba(238,75,26,0.08), transparent 65%);
  }
  body section > * { position: relative; z-index: 1; }

  /* Text + default elements coloring on the dark canvas. */
  body section:not(.paper) .counter { color: rgba(247,241,232,0.45); }
  body section:not(.paper) .eyebrow { color: #FF6A3D; }
  body section:not(.paper) h1 { color: #F7F1E8; }
  body section:not(.paper) h1 .a { color: #FF6A3D; }
  body section:not(.paper) .lede,
  body section:not(.paper) .body-text { color: rgba(247,241,232,0.72); }
  body section:not(.paper) .geser { color: rgba(247,241,232,0.45); }

  /* Info cards keep their LIGHT tone background + dark text on ink (they read as
     raised light tiles) — only soften the edge against the dark canvas. */
  body section:not(.paper) .card { box-shadow: 0 24px 60px rgba(0,0,0,0.35); }
  body section:not(.paper) .catatan-body { color: #F7F1E8; }
  body section:not(.paper) .checklist li { color: #F7F1E8; }
  body section:not(.paper) .brand-handle { color: #F7F1E8; }

  /* Panels that are dark BY DESIGN (terminal, command palette) sit only 11 points
     of luminance above the Ink canvas, so on Ink they read as a smudge rather
     than a device. A hairline edge is what separates them from the background. */
  body section:not(.paper) .cmdp {
    border-color: rgba(247, 241, 232, 0.16);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  }
  body section:not(.paper) .cmdp .search { border-bottom-color: rgba(247, 241, 232, 0.14); }

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
    border-color: rgba(247, 241, 232, 0.16);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  }
  body section:not(.paper) .b-chrome {
    background: #1F1A15;
    border-bottom-color: rgba(247, 241, 232, 0.14);
  }
  body section:not(.paper) .b-url {
    background: #14110E;
    border-color: rgba(247, 241, 232, 0.16);
    color: rgba(247, 241, 232, 0.72);
  }
  body section:not(.paper) .b-card {
    background: #1F1A15;
    border-color: rgba(247, 241, 232, 0.14);
  }
  body section:not(.paper) .b-card .t {
    color: #F7F1E8;
  }
  body section:not(.paper) .b-card .s {
    color: rgba(247, 241, 232, 0.45);
  }

  body section:not(.paper) .terminal {
    border: 1.5px solid rgba(247, 241, 232, 0.16);
    background: #1F1A15;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  }
  body section:not(.paper) .terminal-bar {
    border-bottom: 1px solid rgba(247, 241, 232, 0.10);
    padding-bottom: 12px;
  }

  body section:not(.paper) .prompt {
    background: #1F1A15;
    border-color: #FF6A3D;
  }
  body section:not(.paper) .prompt .lbl {
    background: #14110E;
    color: #FF6A3D;
  }
  body section:not(.paper) .prompt pre {
    color: #F7F1E8;
  }

  body section:not(.paper) .tree {
    background: #1F1A15;
    border-color: rgba(247, 241, 232, 0.16);
    color: rgba(247, 241, 232, 0.72);
  }

  body section:not(.paper) .db .table {
    border-color: rgba(247, 241, 232, 0.16);
    background: #1F1A15;
  }
  body section:not(.paper) .db .table .th {
    background: #14110E;
    color: #F7F1E8;
  }
  body section:not(.paper) .db .table .tr {
    color: rgba(247, 241, 232, 0.72);
    border-top-color: rgba(247, 241, 232, 0.10);
  }
  body section:not(.paper) .db .table .tr .ty {
    color: rgba(247, 241, 232, 0.45);
  }

  body section:not(.paper) .node {
    background: #1F1A15;
    border-color: rgba(247, 241, 232, 0.16);
    color: #F7F1E8;
  }
  body section:not(.paper) .node.filled {
    background: #EE4B1A;
    border-color: #EE4B1A;
    color: #fff;
  }

  body section:not(.paper) .step {
    background: #1F1A15;
    border: 1.5px solid rgba(247, 241, 232, 0.14);
  }
  body section:not(.paper) .step-title {
    color: #F7F1E8;
  }
  body section:not(.paper) .step-body {
    color: rgba(247, 241, 232, 0.72);
  }

  body section:not(.paper) .timeline .tl-card.old {
    background: #1F1A15;
    border: 1.5px solid rgba(247, 241, 232, 0.10);
  }
  body section:not(.paper) .timeline .tl-card.old .d {
    color: rgba(247, 241, 232, 0.45);
  }
  body section:not(.paper) .timeline .tl-card.old .h {
    color: #F7F1E8;
  }
  body section:not(.paper) .timeline .tl-card.old .t {
    color: rgba(247, 241, 232, 0.72);
  }

  body section:not(.paper) .dtable {
    border-top-color: rgba(247, 241, 232, 0.16);
  }
  body section:not(.paper) .dt-row {
    border-top-color: rgba(247, 241, 232, 0.10);
  }
  body section:not(.paper) .dt-row .c {
    color: rgba(247, 241, 232, 0.72);
  }
  body section:not(.paper) .dt-row .c.b {
    color: #F7F1E8;
  }

  body section:not(.paper) .clist .row {
    border-top-color: rgba(247, 241, 232, 0.10);
  }
  body section:not(.paper) .clist .desc {
    color: rgba(247, 241, 232, 0.72);
  }

  body section:not(.paper) .highlight {
    background: #1F1A15;
    border: 1.5px solid rgba(247, 241, 232, 0.14);
  }
  body section:not(.paper) .highlight .sub {
    color: rgba(247, 241, 232, 0.72);
  }

  body section:not(.paper) .diag-bars .panel {
    background: #1F1A15;
    border-color: rgba(247, 241, 232, 0.10);
  }
  body section:not(.paper) .diag-bars .panel.loser {
    border-color: rgba(193, 59, 26, 0.3);
  }
  body section:not(.paper) .diag-bars .panel .foot {
    color: #FF6A3D;
  }
  body section:not(.paper) .diag-bars .panel.loser .foot {
    color: #C13B1A;
  }

  body section:not(.paper) .quote-inset {
    background: #1F1A15;
    border-left-color: #EE4B1A;
  }
  body section:not(.paper) .qi-body {
    color: #F7F1E8;
  }

  body section:not(.paper) .mock {
    background: #1F1A15;
    border-color: rgba(247, 241, 232, 0.16);
  }
  body section:not(.paper) .mock-head {
    color: rgba(247, 241, 232, 0.45);
    border-bottom-color: rgba(247, 241, 232, 0.14);
  }
  body section:not(.paper) .mock-field {
    background: #14110E;
    border-color: rgba(247, 241, 232, 0.16);
    color: #F7F1E8;
  }

  /* ═══ Cover Ink surface — heavier than body Ink: adds the Ember corner halo ═══ */
  section.cover-ink { position: relative; }
  section.cover-ink::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(60% 42% at 100% 0%, rgba(238,75,26,0.16), transparent 60%),
      radial-gradient(50% 40% at 0% 100%, rgba(238,75,26,0.08), transparent 65%);
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
    font-size: 30px; line-height: 1.45; }
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
    color: #FF6A3D;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }
  /* Ember rule under the CTA so it reads as a control, not stray copy. */
  section.cover-ink .geser::before {
    content: "";
    width: 56px; height: 2px;
    background: #FF6A3D;
    border-radius: 1px;
  }

  /* Cover anchor — ID badge (NOT .badge; that is the step-number badge) */
  .cover-badge { position: relative; width: 560px; padding: 48px 44px 44px; border-radius: 26px;
    background: #1F1A15; border: 1.5px solid #2B241D; transform: rotate(-4deg);
    box-shadow: 0 40px 90px rgba(0,0,0,0.55); }
  .cover-badge .hole { position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
    width: 120px; height: 16px; border-radius: 8px; background: #14110E; border: 1.5px solid #2B241D; }
  .cover-badge .brow { display: flex; align-items: center; gap: 12px; margin-top: 20px;
    font-family: 'JetBrains Mono'; font-size: 22px; color: rgba(247,241,232,0.45); letter-spacing: 0.08em; }
  .cover-badge .role { font-family: 'Sora'; font-weight: 800; font-size: 72px; line-height: 1;
    color: #F7F1E8; margin-top: 22px; }
  .cover-badge .sub { font-family: 'JetBrains Mono'; font-size: 24px; color: rgba(247,241,232,0.45); margin-top: 14px; }
  .cover-badge .cover-strike { position: absolute; left: -10px; right: -10px; top: 56%; height: 12px;
    border-radius: 6px; background: #FF6A3D; transform: rotate(-9deg); box-shadow: 0 8px 30px rgba(255,106,61,0.5); }

  /* Cover anchor — NOC status grid */
  .cover-noc { width: 100%; max-width: 840px; }
  .cover-noc .grid { display: grid; gap: 14px; }
  .cover-noc .node { aspect-ratio: 1; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
  .cover-noc .node.down { background: rgba(193,59,26,0.16); border: 1.5px solid #C13B1A; box-shadow: inset 0 0 24px rgba(193,59,26,0.25); }
  .cover-noc .node.up { background: rgba(78,158,92,0.14); border: 1.5px solid #4E9E5C; box-shadow: inset 0 0 24px rgba(78,158,92,0.20); }
  .cover-noc .banner { margin-top: 28px; display: flex; align-items: center; justify-content: center; gap: 14px;
    font-family: 'JetBrains Mono'; font-size: 38px; font-weight: 600; letter-spacing: 0.08em; color: #FF5A4D; }
  .cover-noc .node svg { display: block; }

  /* Cover anchor — Norman door (pull handle contradicts the label) */
  .cover-door { position: relative; width: 340px; height: 460px; border-radius: 16px;
    background: #1F1A15; border: 1.5px solid #2B241D; display: flex; align-items: center; justify-content: flex-end;
    padding-right: 30px; box-shadow: 0 40px 90px rgba(0,0,0,0.55); }
  .cover-door .label { position: absolute; top: 34px; left: 0; right: 0; text-align: center;
    font-family: 'JetBrains Mono'; font-size: 34px; font-weight: 600; letter-spacing: 0.22em; color: #FF6A3D; }
  .cover-door .handle { width: 26px; height: 200px; border-radius: 13px; background: #F7F1E8; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .cover-door .hand { position: absolute; right: -6px; top: 50%; transform: translateY(-50%); }
  .cover-door .hand svg { display: block; }

  /* ═══ v1.0 Stage-B mockups — browser · quote · datatable · commandlist · timeline ═══ */

  /* Browser window */
  .browser { width: 100%; border: 1.5px solid #1C0A05; border-radius: 24px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(28,10,5,0.10); background: #FFFDF9; }
  .b-chrome { background: #FAF4EA; border-bottom: 1.5px solid rgba(28,10,5,0.14);
    padding: 20px 24px; display: flex; align-items: center; gap: 20px; }
  .b-dots { display: flex; gap: 8px; }
  .b-dots i { width: 14px; height: 14px; border-radius: 50%; display: block; }
  .b-dots .r { background: #FF5F56; } .b-dots .y { background: #FFBD2E; } .b-dots .g { background: #27C93F; }
  .b-url { flex: 1; background: #FBF6EF; border: 1px solid rgba(28,10,5,0.14); border-radius: 999px;
    padding: 10px 24px; font-family: 'JetBrains Mono'; font-size: 20px; color: #6E4B3E; }
  .b-main { padding: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .b-card { border: 1.5px solid rgba(28,10,5,0.14); border-radius: 16px; min-height: 150px;
    background: #FBF6EF; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
  .b-card .t { font-family: 'Sora'; font-weight: 700; font-size: 40px; color: #1C0A05; line-height: 1.1; }
  .b-card .s { font-family: 'JetBrains Mono'; font-size: 20px; color: #6E4B3E; margin-top: 4px; }

  /* Quote inset (EB Garamond) */
  .quote-inset { width: 100%; border-left: 6px solid #EE4B1A; background: #EDE7DA;
    border-radius: 4px; padding: 40px 48px; }
  .qi-body { font-family: 'EB Garamond', Georgia, serif; font-style: italic; font-weight: 500;
    font-size: 48px; line-height: 1.35; color: #1C0A05; }
  .qi-author { font-family: 'JetBrains Mono'; font-size: 24px; color: #EE4B1A; margin-top: 24px;
    letter-spacing: 0.08em; text-transform: uppercase; }

  /* Data table ✗/✓ */
  .dtable { width: 100%; border-top: 1.5px solid #1C0A05; }
  .dt-hr { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; font-family: 'JetBrains Mono';
    font-size: 24px; letter-spacing: 0.1em; text-transform: uppercase; padding: 20px 0; }
  .dt-hr .no { color: #C13B1A; } .dt-hr .ok { color: #4E9E5C; }
  .dt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
    border-top: 1px solid rgba(28,10,5,0.10); padding: 26px 0; }
  .dt-row .c { font-family: 'Inter'; font-size: 28px; line-height: 1.35; color: #3D2419; }
  .dt-row .c.b { color: #1C0A05; font-weight: 600; }

  /* Command list */
  .clist { width: 100%; display: flex; flex-direction: column; }
  .clist .row { display: flex; align-items: baseline; gap: 32px; padding: 24px 0;
    border-top: 1.5px solid rgba(28,10,5,0.10); }
  .clist .row:first-child { border-top: none; }
  .clist .cmd { font-family: 'JetBrains Mono'; font-size: 34px; color: #EE4B1A; min-width: 280px; }
  .clist .desc { font-family: 'Inter'; font-size: 28px; color: #3D2419; }

  /* Timeline (then / now) */
  .timeline { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .tl-card { border-radius: 20px; padding: 36px 32px; }
  .tl-card.old { background: #EDE7DA; }
  .tl-card.new { background: #FBE9D9; border: 2px solid #EE4B1A; }
  .tl-card .d { font-family: 'JetBrains Mono'; font-size: 22px; letter-spacing: 0.12em;
    text-transform: uppercase; color: #6E4B3E; }
  .tl-card.new .d { color: #EE4B1A; }
  .tl-card .h { font-family: 'Sora'; font-weight: 700; font-size: 36px; color: #1C0A05; margin-top: 14px; line-height: 1.15; }
  .tl-card .t { font-family: 'Inter'; font-size: 26px; color: #3D2419; margin-top: 12px; line-height: 1.4; }

  /* ═══ v1.0 TASK-1 mockups — promptcard · foldertree · commandpalette · database · gitbranch ═══ */

  /* Prompt card — copy-paste AI prompt, 2px ember border + corner label */
  .prompt { position: relative; border: 2px solid #EE4B1A; border-radius: 20px;
    padding: 44px 40px 40px; background: #FFFDF9; }
  .prompt .lbl { position: absolute; top: -16px; left: 32px; background: #FBF6EF; padding: 0 14px;
    font-family: 'JetBrains Mono'; font-size: 20px; letter-spacing: 0.18em;
    text-transform: uppercase; color: #EE4B1A; }
  .prompt pre { font-family: 'JetBrains Mono'; font-size: 30px; line-height: 1.55;
    color: #1C0A05; white-space: pre-wrap; }

  /* Folder tree — mono directory listing, active row Ember */
  .tree { width: 100%; background: #FFFDF9; border: 1.5px solid rgba(28,10,5,0.14);
    border-radius: 20px; padding: 40px 44px; font-family: 'JetBrains Mono'; font-size: 30px;
    line-height: 1.7; color: #3D2419; white-space: pre-wrap; }
  .tree .on { color: #EE4B1A; font-weight: 600; }

  /* Command palette — Cmd+K menu on Ink surface */
  .cmdp { width: 100%; background: #1F1A15; border: 1.5px solid #2B241D; border-radius: 20px;
    overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,0.4); }
  .cmdp .search { padding: 28px 32px; border-bottom: 1px solid #2B241D;
    display: flex; align-items: center; gap: 16px; }
  .cmdp .search .car { color: #FF6A3D; font-family: 'JetBrains Mono'; font-size: 30px; }
  .cmdp .search .q { font-family: 'JetBrains Mono'; font-size: 30px; color: #F7F1E8; }
  .cmdp .row { padding: 22px 32px; display: flex; align-items: center; gap: 20px;
    font-family: 'JetBrains Mono'; font-size: 28px; color: rgba(247,241,232,0.72); }
  .cmdp .row.on { background: #2B241D; color: #F7F1E8; }
  .cmdp .row svg { flex: none; }
  .cmdp .row .k { margin-left: auto; font-size: 20px; color: rgba(247,241,232,0.45); }

  /* Database — two related tables + relation glyph */
  .db { width: 100%; display: flex; align-items: center; justify-content: center;
    gap: 48px; flex-wrap: wrap; }
  .db .table { border: 1.5px solid #1C0A05; border-radius: 16px; overflow: hidden;
    min-width: 300px; background: #FFFDF9; }
  .db .table .th { background: #14110E; color: #F7F1E8; font-family: 'JetBrains Mono';
    font-size: 26px; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
  .db .table .tr { padding: 14px 24px; font-family: 'JetBrains Mono'; font-size: 24px;
    color: #3D2419; border-top: 1px solid rgba(28,10,5,0.10);
    display: flex; justify-content: space-between; gap: 24px; }
  .db .table .tr .ty { color: #A48C7E; }
  .db .rel { font-family: 'JetBrains Mono'; font-size: 28px; color: #EE4B1A; }

  /* Git branch — fixed 2-branch SVG diagram */
  .git { width: 100%; position: relative; padding: 40px 20px; }
  .git svg { width: 100%; height: 300px; display: block; }

  /* Illustration — unDraw SVG for abstract concepts / analogies.

     Sized by HEIGHT, not by a square box. 108 of the 145 allowlisted illustrations are
     landscape (median viewBox ratio 1.29, up to 2.86), so the old fixed
     width:240px + height:240px letterboxed them: a 2.86-ratio drawing became 240×84 floating
     in a 240×240 slot, which reads as "the illustration came out tiny". Pinning the
     height and letting width follow the viewBox gives every slug the same visual weight.
     max-width caps the two most extreme panoramas so they cannot run past the canvas;
     that is the only case where height ends up below the nominal value. */
  .diag-illustration { width: 100%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; padding: 16px 0; }

  /* One layout for 1 and 2 illustrations — the count only changes the size class, so
     the single and pair cases cannot drift apart. justify-content:center (NOT
     space-between) keeps a pair together instead of shoving each to an edge. */
  .illustration-group { display: flex; flex-direction: row;
    align-items: center; justify-content: center; gap: 28px; flex-wrap: nowrap;
    width: 100%; }
  .illustration-group .illus-item { display: flex; flex-direction: column;
    align-items: center; gap: 10px; flex-shrink: 0; min-width: 0; }
  .illustration-group .illus-item svg { display: block; flex-shrink: 0;
    width: auto; }
  /* Heights are tuned against the free space a point slide actually leaves: .diag-wrap
     measures ~778px on a two-line headline, and illustration + 16px gap + caption must
     fit inside it with slack for a longer headline. max-width caps the panoramas (up to
     2.86:1) so they cannot run past the 1080px canvas; a pair is capped so both items
     plus the 28px gap stay inside it. */
  .illustration-group.is-single .illus-item svg { height: 340px; max-width: 780px; }
  .illustration-group.is-pair   .illus-item svg { height: 260px; max-width: 380px; }

  /* Screenshot evidence — uploaded real evidence image or pending placeholder */
  .diag-screenshot { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .diag-screenshot img { max-width: 100%; max-height: 480px; width: auto; height: auto; border-radius: 16px; border: 1.5px solid rgba(28,10,5,0.18); box-shadow: 0 16px 40px rgba(0,0,0,0.12); object-fit: contain; }
  .diag-screenshot-placeholder { width: 100%; padding: 36px 32px; border: 2px dashed #EE4B1A; border-radius: 20px; background: rgba(238,75,26,0.04); display: flex; flex-direction: column; gap: 14px; text-align: left; }
  .diag-screenshot-badge { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 22px; color: #EE4B1A; letter-spacing: 0.08em; text-transform: uppercase; }
  .diag-screenshot-source { font-size: 26px; line-height: 1.4; color: #1C0A05; font-weight: 600; }
  .diag-screenshot-source span { color: #EE4B1A; }
  .diag-screenshot-brief-item { font-size: 22px; line-height: 1.4; color: #524036; }
  .diag-screenshot-brief-item strong { color: #1C0A05; }
`;
