// Mirrors the <style> block of "design-system/TEMPLATE-editorial-v3.html".
// Do not hand-edit one without the other: the Vour palette re-base was applied to both
// by the same mapping, and the template is still the source to re-copy from.
export const carouselCss = String.raw`
  /* ════════════════════════════════════════════════════════
     DO NOT EDIT THIS STYLE BLOCK.
     Replace content inside <section> tags only.
     ════════════════════════════════════════════════════════ */
  *, *::before, *::after { box-sizing: border-box; }

  section {
    width: 1080px; height: 1350px;
    padding: 96px 80px 80px;
    /* Light surface. Two teal washes give the corners some life, and a 32px dot grid
       at 4% keeps the field from reading as flat printer white. The dots are the same
       accent teal as the headline, so the texture belongs to the brand rather than
       being generic paper noise. */
    background:
      radial-gradient(circle at 1px 1px, rgba(15,102,102,0.055) 1.5px, transparent 1.6px) 0 0 / 32px 32px,
      radial-gradient(55% 40% at 100% 0%, rgba(80,220,220,0.10), transparent 65%),
      radial-gradient(60% 50% at 10% 100%, rgba(15,102,102,0.05), transparent 70%),
      #F2F7F7;
    color: #000000;
    font-family: 'Inter', system-ui, sans-serif;
    overflow: hidden;
    display: flex; flex-direction: column;
    position: relative;
  }

  .eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 24px; line-height: 1;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #0F6666;
  }
  .counter {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 400; font-size: 24px; line-height: 1;
    letter-spacing: 0.04em; color: #7E9494;
  }
  h1 { font-family: 'Sora', system-ui, sans-serif;
    font-weight: 800; font-size: 104px; line-height: 1.02;
    letter-spacing: -0.025em; margin: 0; color: #000000;
  }
  h1.hero { font-size: 128px; line-height: 0.98; }               /* --fs-title-lg — cover */
  h1.compact { font-size: 88px; line-height: 1.04; }             /* USE ON EVERY MOCKUP SLIDE — see MAKING_CAROUSELS.md §7 */
  h1 .a   { color: #0F6666; }                                    /* the accent word — exactly ONE per headline */

  .lede, .body-text {
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 500; font-size: 32px; line-height: 1.4;
    color: #223131; margin: 0;
  }

  .mt-8{margin-top:8px;} .mt-16{margin-top:16px;} .mt-24{margin-top:24px;}
  .mt-32{margin-top:32px;} .mt-40{margin-top:40px;} .mt-48{margin-top:48px;}
  .mt-64{margin-top:64px;}

  .brand-row { display: flex; align-items: center; gap: 16px; }
  .brand-disc {
    width: 72px; height: 72px; border-radius: 50%;
    overflow: hidden; background: #000000; flex: none;
  }
  .brand-disc.sm { width: 44px; height: 44px; }
  .brand-disc img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .brand-handle {
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 700; font-size: 32px; color: #000000;
  }

  /* ── Info card (editorial — pick ONE background per slide) ──
     Six tones, kept six: they are what stops a deck reading as one flat colour, and
     collapsing them into a single teal would trade brand consistency for monotony.
     All six now sit in the cool half of the wheel so they belong to the logo, but the
     CLASS NAMES are the schema's tone enum and are left alone — renaming them would
     invalidate every plan already stored in the carousels table. Read them as labels,
     not as colour descriptions. */
  .card { border-radius: 24px; padding: 32px; }
  .card-peach  { background: #E2F4F4; }   /* aqua   — neutral / default */
  .card-stone  { background: #E4E9E9; }   /* stone  — loser / scraped */
  .card-mint   { background: #DDF2E9; }   /* mint   — success */
  .card-sky    { background: #DCEAF6; }   /* sky    — tooling / info */
  .card-pink   { background: #E6E2F7; }   /* iris   — design */
  .card-amber  { background: #D9F1F7; }   /* cyan   — highlight / perf */
  .card-head   { display: flex; align-items: center; gap: 16px; }
  .card-ico    {
    width: 48px; height: 48px; border-radius: 12px;
    background: rgba(0,0,0,0.06);
    display: flex; align-items: center; justify-content: center; flex: none;
  }
  .card-title  {
    font-family: 'Sora', system-ui, sans-serif;
    font-weight: 700; font-size: 40px; line-height: 1.15; color: #000000;
  }
  .card-body   {
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 500; font-size: 28px; line-height: 1.4; color: #223131;
    margin-top: 8px;
  }
  .card-label  {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 24px; letter-spacing: 0.18em;
    text-transform: uppercase; margin-bottom: 16px;
  }

  .highlight {
    border-radius: 20px; padding: 24px 28px; background: #E2F4F4;
  }
  .highlight .strong {
    font-family: 'Sora'; font-weight: 700; font-size: 32px; line-height: 1.2;
    color: #0F6666;
  }
  .highlight .sub {
    font-family: 'Inter'; font-weight: 500; font-size: 26px; line-height: 1.4;
    color: #223131; margin-top: 8px;
  }

  /* Inverts against whatever surface it sits on — that inversion IS the emphasis.
     Literal colours here went black-on-black once logo black became the dark base. */
  .callout {
    background: var(--ms-invert-bg); color: var(--ms-invert-fg);
    border-radius: 20px; padding: 32px;
    display: flex; align-items: flex-start; gap: 16px;
    font-family: 'Inter'; font-weight: 500; font-size: 28px; line-height: 1.4;
  }
  .callout-ico {
    width: 40px; height: 40px; border-radius: 10px;
    background: var(--ms-invert-chip);
    display: flex; align-items: center; justify-content: center; flex: none;
  }

  .step {
    background: #E2F4F4; border-radius: 20px; padding: 32px;
    display: flex; gap: 20px; align-items: flex-start;
  }
  .step.amber { background: #D9F1F7; }
  .badge {
    width: 40px; height: 40px; border-radius: 50%;
    background: #0F6666; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Sora'; font-weight: 700; font-size: 22px; flex: none;
  }
  .step-title {
    font-family: 'Sora'; font-weight: 700; font-size: 32px; line-height: 1.15;
    color: #000000;
  }
  .step-body  {
    font-family: 'Inter'; font-weight: 500; font-size: 28px; line-height: 1.4;
    color: #223131; margin-top: 4px;
  }

  .flex-col { display: flex; flex-direction: column; }
  .flex-grow { flex: 1; }
  .gap-16 { gap: 16px; }

  /* MOCKUP SLIDE WRAPPER — wraps every terminal / scene / perm-table / diag-*.
     flex:1 lets the wrapper grow into the free space between description and catatan.
     min-height:0 lets it SHRINK when the mock is tall — without it, a tall terminal
     pushes CATATAN off the 1350 canvas. Do not remove either declaration.
     See MAKING_CAROUSELS.md §7 for the full contract. */
  .diag-wrap {
    flex: 1; min-height: 0;
    display: flex; align-items: center; justify-content: center;
    width: 100%;
  }
  .diag-wrap > * { max-width: 100%; }

  /* Lede + body caps — stop text-only slides from overflowing the safe area. */
  .lede { max-width: 900px; }
  .body-text { max-width: 900px; }

  .geser {
    font-family: 'JetBrains Mono'; font-size: 22px; color: #7E9494;
    letter-spacing: 0.04em; position: absolute; bottom: 80px; left: 80px;
  }

  /* ═════════════════════════════════════════════════════
     LINE-DIAGRAM COMPONENTS
     Editorial surface only. Every component below is designed
     for the same 1080×1350 canvas as the classic slides.
     ═════════════════════════════════════════════════════ */

  /* Base line-art node */
  .node {
    display: inline-flex; align-items: center; gap: 12px;
    padding: 14px 24px; min-height: 64px;
    background: #F8FBFB;
    border: 1.5px solid #000000;
    border-radius: 16px;
    font-family: 'JetBrains Mono'; font-weight: 500; font-size: 26px;
    line-height: 1; color: #000000; white-space: nowrap;
  }
  .node.filled {
    background: #0F6666; border-color: #0F6666; color: #fff;
    font-family: 'Sora'; font-weight: 700;
  }
  .node.big {
    padding: 20px 44px; min-height: 96px; font-size: 44px;
    font-family: 'Sora'; font-weight: 700; border-radius: 20px;
  }
  .node.mint  { border-color: #16705A; color: #16705A; }
  .node.sky   { border-color: #245F8F; color: #245F8F; }
  .node.amber { border-color: #0B6070; color: #0B6070; }
  .node.pink  { border-color: #5C5CA8; color: #5C5CA8; }
  .node.red   { border-color: #607272; color: #607272; }

  /* CATATAN recap panel at slide bottom */
  .catatan {
    border: 1.5px solid #0F6666; border-radius: 16px; padding: 24px 32px;
  }
  .catatan-label {
    font-family: 'JetBrains Mono'; font-weight: 500; font-size: 22px;
    letter-spacing: 0.18em; text-transform: uppercase; color: #0F6666;
  }
  .catatan-body {
    margin-top: 8px; font-family: 'Sora'; font-weight: 700;
    font-size: 32px; color: #000000;
  }

  /* Concept hub: center node → 3-5 child pills below */
  .diag-hub { position: relative; width: 100%; height: 380px; }
  .diag-hub .center { position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 2; }
  .diag-hub .children { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; }
  .diag-hub svg.lines { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
  .diag-hub svg.lines .stroke { stroke: #0F6666; stroke-width: 1.5; fill: none; }
  .diag-hub svg.lines .head { fill: #0F6666; }

  /* Flow chain: horizontal row of nodes + arrows */
  .diag-flow { display: flex; align-items: center; gap: 20px; justify-content: center; }
  .diag-flow .arrow { color: #0F6666; font-size: 40px; line-height: 1; font-family: 'JetBrains Mono'; }

  /* Token strip: chip row with ↓ under each */
  .diag-tokens { display: flex; gap: 20px; align-items: flex-start; justify-content: center; }
  .diag-tokens .chip-col { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .diag-tokens .chip {
    padding: 14px 24px; border: 1.5px solid #0F6666; border-radius: 12px;
    background: #F8FBFB; font-family: 'JetBrains Mono'; font-weight: 500; font-size: 28px;
    color: #000000; min-width: 96px; text-align: center; line-height: 1;
  }
  .diag-tokens .drop { color: #4A5C5C; font-size: 32px; line-height: 1; }

  /* Comparison bars: two panels side-by-side */
  .diag-bars { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .diag-bars .panel { border: 1.5px solid #0F6666; border-radius: 20px; padding: 28px 32px; min-height: 220px; display: flex; flex-direction: column; gap: 16px; }
  .diag-bars .panel.loser { border-color: #607272; }
  .diag-bars .panel .h {
    font-family: 'JetBrains Mono'; font-weight: 500; font-size: 22px;
    letter-spacing: 0.18em; text-transform: uppercase; color: #0F6666;
  }
  .diag-bars .panel.loser .h { color: #607272; }
  .diag-bars .panel .rows { display: flex; flex-direction: column; gap: 14px; flex: 1; justify-content: center; }
  .diag-bars .bar { height: 24px; border-radius: 6px; background: #0F6666; }
  .diag-bars .bar.faded { background: #607272; opacity: 0.35; }
  .diag-bars .bar.dim   { background: #7E9494; opacity: 0.45; }
  .diag-bars .panel .foot {
    font-family: 'JetBrains Mono'; font-weight: 500; font-size: 22px;
    letter-spacing: 0.14em; text-transform: uppercase; color: #0F6666;
    word-break: break-word; overflow-wrap: anywhere;
  }
  .diag-bars .panel.loser .foot { color: #607272; }

  /* Icon hub: center node → 4 tool icons + dashed arrows */
  .diag-icon-hub { position: relative; width: 100%; height: 400px; }
  .diag-icon-hub .center { position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 2; }
  .diag-icon-hub .tools { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: flex-end; }
  .diag-icon-hub .tool { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 22%; }
  .diag-icon-hub .tool .glyph { width: 88px; height: 88px; }
  .diag-icon-hub .tool .glyph svg { width: 100%; height: 100%; stroke: var(--ms-fg); stroke-width: 1.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .diag-icon-hub .tool .label { font-family: 'JetBrains Mono'; font-size: 22px; color: var(--ms-fg-muted); text-align: center; }
  .diag-icon-hub svg.lines { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
  .diag-icon-hub svg.lines .stroke { stroke: #0F6666; stroke-width: 1.5; fill: none; stroke-dasharray: 6 6; }
  .diag-icon-hub svg.lines .head { fill: #0F6666; }

  /* Terminal code block */
  .terminal { background: #000000; border: 1.5px solid #162020; border-radius: 20px; padding: 36px 40px; color: #fff; font-family: 'JetBrains Mono'; width: 100%; }
  .terminal-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
  .terminal-bar .dot { width: 14px; height: 14px; border-radius: 50%; }
  .terminal-bar .dot.r { background: #1F5C5C; }
  .terminal-bar .dot.y { background: #2E8F8F; }
  .terminal-bar .dot.g { background: #50DCDC; }
  .terminal-bar .title { margin-left: 16px; color: rgba(255,255,255,0.55); font-size: 22px; }
  .terminal-bar .urlbar { margin-left: 16px; flex: 1; background: rgba(255,255,255,0.10); color: rgba(255,255,255,0.75); font-family: 'JetBrains Mono'; font-size: 20px; padding: 8px 18px; border-radius: 999px; text-align: center; }
  .terminal-body { font-family: 'JetBrains Mono'; font-size: 24px; line-height: 1.6; color: #fff; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
  .terminal-body .cmt { color: rgba(242,247,247,0.45); }
  .terminal-body .key { color: #4DE1F3; }
  .terminal-body .val { color: #9FB4FF; }
  .terminal-body .kw  { color: #50DCDC; }
  .terminal-body .str { color: #9FB4FF; }
  .terminal-body .num { color: #3FD8A8; }

  /* Permission table */
  .perm-table { display: flex; flex-direction: column; gap: 16px; }
  .perm-row { display: grid; grid-template-columns: 220px 1fr; gap: 32px; align-items: center; border: 1.5px solid #000000; border-radius: 20px; padding: 24px 28px; }
  .perm-user { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .perm-user .avatar { width: 72px; height: 72px; position: relative; }
  .perm-user .avatar svg { width: 100%; height: 100%; stroke: #000000; stroke-width: 1.5; fill: none; }
  .perm-user .avatar .crown { position: absolute; bottom: -4px; right: -4px; width: 28px; height: 28px; background: #0F6666; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-family: 'Sora'; font-weight: 700; }
  .perm-user .role { font-family: 'Sora'; font-weight: 700; font-size: 26px; color: #000000; }
  .perm-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .perm-cell { border: 1.5px solid #000000; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; font-family: 'JetBrains Mono'; font-weight: 500; font-size: 22px; color: #000000; }
  .perm-cell .yes { color: #16705A; font-size: 24px; }
  .perm-cell .no  { color: #607272; font-size: 24px; }

  /* Recap checklist */
  .checklist { display: flex; flex-direction: column; gap: 20px; margin: 0; padding: 0; list-style: none; }
  .checklist li { display: flex; align-items: center; gap: 24px; font-family: 'Sora'; font-weight: 500; font-size: 40px; color: #000000; }
  .checklist .tick { color: #16705A; font-size: 40px; line-height: 1; width: 44px; flex: none; }

  /* Illustrated scene (login-form + locked-panel mockup) */
  .scene { display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: stretch; }
  .mock { border: 1.5px solid #000000; border-radius: 20px; padding: 24px; background: #F8FBFB; min-height: 360px; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; }
  .mock-head { font-family: 'JetBrains Mono'; font-size: 20px; letter-spacing: 0.18em; text-transform: uppercase; color: #4A5C5C; border-bottom: 1px dashed #7E9494; padding-bottom: 12px; }
  .mock-field { border: 1px solid #000000; border-radius: 12px; padding: 12px 16px; font-family: 'JetBrains Mono'; font-size: 20px; color: #4A5C5C; }
  .mock-btn { background: #0F6666; color: #fff; border-radius: 12px; padding: 12px 16px; font-family: 'Sora'; font-weight: 700; font-size: 20px; text-align: center; }
  .mock-body { display: flex; flex-direction: column; gap: 12px; }
  .mock.locked .mock-body { opacity: 0.22; filter: blur(1.5px); pointer-events: none; }
  .mock-overlay { position: absolute; inset: 0; padding: 24px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .mock-lock { display: inline-flex; align-items: center; gap: 12px; padding: 14px 22px; border-radius: 999px; background: #000000; color: #fff; font-family: 'JetBrains Mono'; font-weight: 500; font-size: 20px; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 12px 32px rgba(0,0,0,0.28); }
  .mock-lock svg { width: 26px; height: 26px; }
  .scene-arrow { font-family: 'JetBrains Mono'; font-size: 40px; color: #0F6666; align-self: center; }
`;
