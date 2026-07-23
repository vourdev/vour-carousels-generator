// Verbatim from "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" <style> block.
// DO NOT EDIT — regenerate by re-copying if the design system updates.
export const carouselCss = String.raw`
  /* ════════════════════════════════════════════════════════
     DO NOT EDIT THIS STYLE BLOCK.
     Replace content inside <section> tags only.
     ════════════════════════════════════════════════════════ */
  *, *::before, *::after { box-sizing: border-box; }

  section {
    width: 1080px; height: 1350px;
    padding: 96px 80px 80px;
    background:
      radial-gradient(55% 40% at 100% 0%, rgba(233,75,25,0.06), transparent 65%),
      radial-gradient(60% 50% at 10% 100%, rgba(233,75,25,0.04), transparent 70%),
      #FBF6EF;
    color: #1F0904;
    font-family: 'Nunito', system-ui, sans-serif;
    overflow: hidden;
    display: flex; flex-direction: column;
    position: relative;
  }

  .eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 24px; line-height: 1;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #E94B19;
  }
  .counter {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 400; font-size: 24px; line-height: 1;
    letter-spacing: 0.04em; color: #A48C7E;
  }
  h1 { font-family: 'Sora', system-ui, sans-serif;
    font-weight: 800; font-size: 104px; line-height: 1.02;
    letter-spacing: -0.025em; margin: 0; color: #1F0904;
  }
  h1.hero { font-size: 128px; line-height: 0.98; }               /* --fs-title-lg — cover */
  h1.compact { font-size: 88px; line-height: 1.04; }             /* USE ON EVERY MOCKUP SLIDE — see MAKING_CAROUSELS.md §7 */
  h1 .a   { color: #E94B19; }                                    /* the orange accent word — exactly ONE per headline */

  .lede, .body-text {
    font-family: 'Nunito', system-ui, sans-serif;
    font-weight: 500; font-size: 32px; line-height: 1.4;
    color: #3D1F15; margin: 0;
  }

  .mt-8{margin-top:8px;} .mt-16{margin-top:16px;} .mt-24{margin-top:24px;}
  .mt-32{margin-top:32px;} .mt-40{margin-top:40px;} .mt-48{margin-top:48px;}
  .mt-64{margin-top:64px;}

  .brand-row { display: flex; align-items: center; gap: 16px; }
  .brand-disc {
    width: 72px; height: 72px; border-radius: 50%;
    overflow: hidden; background: #07070e; flex: none;
  }
  .brand-disc.sm { width: 44px; height: 44px; }
  .brand-disc img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .brand-handle {
    font-family: 'Nunito', system-ui, sans-serif;
    font-weight: 700; font-size: 32px; color: #1F0904;
  }

  /* ── Info card (editorial — pick ONE background per slide) ── */
  .card { border-radius: 24px; padding: 32px; }
  .card-peach  { background: #FBE9D9; }   /* neutral / default */
  .card-stone  { background: #EDE7DA; }   /* loser / scraped */
  .card-mint   { background: #E3F1E1; }   /* success */
  .card-sky    { background: #DEEAF7; }   /* tooling / info */
  .card-pink   { background: #F7DDE6; }   /* design */
  .card-amber  { background: #FBE7B0; }   /* highlight / perf */
  .card-head   { display: flex; align-items: center; gap: 16px; }
  .card-ico    {
    width: 48px; height: 48px; border-radius: 12px;
    background: rgba(31,9,4,0.06);
    display: flex; align-items: center; justify-content: center; flex: none;
  }
  .card-title  {
    font-family: 'Sora', system-ui, sans-serif;
    font-weight: 700; font-size: 40px; line-height: 1.15; color: #1F0904;
  }
  .card-body   {
    font-family: 'Nunito', system-ui, sans-serif;
    font-weight: 500; font-size: 28px; line-height: 1.4; color: #3D1F15;
    margin-top: 8px;
  }
  .card-label  {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 24px; letter-spacing: 0.18em;
    text-transform: uppercase; margin-bottom: 16px;
  }

  .highlight {
    border-radius: 20px; padding: 24px 28px; background: #FBE9D9;
  }
  .highlight .strong {
    font-family: 'Sora'; font-weight: 700; font-size: 32px; line-height: 1.2;
    color: #E94B19;
  }
  .highlight .sub {
    font-family: 'Nunito'; font-weight: 500; font-size: 26px; line-height: 1.4;
    color: #3D1F15; margin-top: 8px;
  }

  .callout {
    background: #1F0904; color: #fff;
    border-radius: 20px; padding: 32px;
    display: flex; align-items: flex-start; gap: 16px;
    font-family: 'Nunito'; font-weight: 500; font-size: 28px; line-height: 1.4;
  }
  .callout-ico {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center; flex: none;
  }

  .step {
    background: #FBE9D9; border-radius: 20px; padding: 32px;
    display: flex; gap: 20px; align-items: flex-start;
  }
  .step.amber { background: #FBE7B0; }
  .badge {
    width: 40px; height: 40px; border-radius: 50%;
    background: #E94B19; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Sora'; font-weight: 700; font-size: 22px; flex: none;
  }
  .step-title {
    font-family: 'Sora'; font-weight: 700; font-size: 32px; line-height: 1.15;
    color: #1F0904;
  }
  .step-body  {
    font-family: 'Nunito'; font-weight: 500; font-size: 28px; line-height: 1.4;
    color: #3D1F15; margin-top: 4px;
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
    font-family: 'JetBrains Mono'; font-size: 22px; color: #A48C7E;
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
    background: #FDFBF6;
    border: 1.5px solid #1F0904;
    border-radius: 16px;
    font-family: 'JetBrains Mono'; font-weight: 500; font-size: 26px;
    line-height: 1; color: #1F0904; white-space: nowrap;
  }
  .node.filled {
    background: #E94B19; border-color: #E94B19; color: #fff;
    font-family: 'Sora'; font-weight: 700;
  }
  .node.big {
    padding: 20px 44px; min-height: 96px; font-size: 44px;
    font-family: 'Sora'; font-weight: 700; border-radius: 20px;
  }
  .node.mint  { border-color: #4E9E5C; color: #4E9E5C; }
  .node.sky   { border-color: #2F6EBC; color: #2F6EBC; }
  .node.amber { border-color: #B98A0D; color: #B98A0D; }
  .node.pink  { border-color: #C1547B; color: #C1547B; }
  .node.red   { border-color: #C13B1A; color: #C13B1A; }

  /* CATATAN recap panel at slide bottom */
  .catatan {
    border: 1.5px solid #E94B19; border-radius: 16px; padding: 24px 32px;
  }
  .catatan-label {
    font-family: 'JetBrains Mono'; font-weight: 500; font-size: 22px;
    letter-spacing: 0.18em; text-transform: uppercase; color: #E94B19;
  }
  .catatan-body {
    margin-top: 8px; font-family: 'Sora'; font-weight: 700;
    font-size: 32px; color: #1F0904;
  }

  /* Concept hub: center node → 3-5 child pills below */
  .diag-hub { position: relative; width: 100%; height: 380px; }
  .diag-hub .center { position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 2; }
  .diag-hub .children { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; }
  .diag-hub svg.lines { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
  .diag-hub svg.lines .stroke { stroke: #E94B19; stroke-width: 1.5; fill: none; }
  .diag-hub svg.lines .head { fill: #E94B19; }

  /* Flow chain: horizontal row of nodes + arrows */
  .diag-flow { display: flex; align-items: center; gap: 20px; justify-content: center; }
  .diag-flow .arrow { color: #E94B19; font-size: 40px; line-height: 1; font-family: 'JetBrains Mono'; }

  /* Token strip: chip row with ↓ under each */
  .diag-tokens { display: flex; gap: 20px; align-items: flex-start; justify-content: center; }
  .diag-tokens .chip-col { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .diag-tokens .chip {
    padding: 14px 24px; border: 1.5px solid #E94B19; border-radius: 12px;
    background: #FDFBF6; font-family: 'JetBrains Mono'; font-weight: 500; font-size: 28px;
    color: #1F0904; min-width: 96px; text-align: center; line-height: 1;
  }
  .diag-tokens .drop { color: #6E4B3E; font-size: 32px; line-height: 1; }

  /* Comparison bars: two panels side-by-side */
  .diag-bars { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .diag-bars .panel { border: 1.5px solid #E94B19; border-radius: 20px; padding: 28px 32px; min-height: 220px; display: flex; flex-direction: column; gap: 16px; }
  .diag-bars .panel.loser { border-color: #C13B1A; }
  .diag-bars .panel .h {
    font-family: 'JetBrains Mono'; font-weight: 500; font-size: 22px;
    letter-spacing: 0.18em; text-transform: uppercase; color: #E94B19;
  }
  .diag-bars .panel.loser .h { color: #C13B1A; }
  .diag-bars .panel .rows { display: flex; flex-direction: column; gap: 14px; flex: 1; justify-content: center; }
  .diag-bars .bar { height: 24px; border-radius: 6px; background: #E94B19; }
  .diag-bars .bar.faded { background: #C13B1A; opacity: 0.35; }
  .diag-bars .bar.dim   { background: #A48C7E; opacity: 0.45; }
  .diag-bars .panel .foot {
    font-family: 'JetBrains Mono'; font-weight: 500; font-size: 22px;
    letter-spacing: 0.14em; text-transform: uppercase; color: #E94B19;
    word-break: break-word; overflow-wrap: anywhere;
  }
  .diag-bars .panel.loser .foot { color: #C13B1A; }

  /* Icon hub: center node → 4 tool icons + dashed arrows */
  .diag-icon-hub { position: relative; width: 100%; height: 400px; }
  .diag-icon-hub .center { position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 2; }
  .diag-icon-hub .tools { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: flex-end; }
  .diag-icon-hub .tool { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 22%; }
  .diag-icon-hub .tool .glyph { width: 88px; height: 88px; }
  .diag-icon-hub .tool .glyph svg { width: 100%; height: 100%; stroke: #1F0904; stroke-width: 1.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .diag-icon-hub .tool .label { font-family: 'JetBrains Mono'; font-size: 22px; color: #6E4B3E; text-align: center; }
  .diag-icon-hub svg.lines { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
  .diag-icon-hub svg.lines .stroke { stroke: #E94B19; stroke-width: 1.5; fill: none; stroke-dasharray: 6 6; }
  .diag-icon-hub svg.lines .head { fill: #E94B19; }

  /* Terminal code block */
  .terminal { background: #1F0904; border-radius: 20px; padding: 36px 40px; color: #fff; font-family: 'JetBrains Mono'; width: 100%; }
  .terminal-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
  .terminal-bar .dot { width: 14px; height: 14px; border-radius: 50%; }
  .terminal-bar .dot.r { background: #FF5F56; }
  .terminal-bar .dot.y { background: #FFBD2E; }
  .terminal-bar .dot.g { background: #27C93F; }
  .terminal-bar .title { margin-left: 16px; color: rgba(255,255,255,0.55); font-size: 22px; }
  .terminal-bar .urlbar { margin-left: 16px; flex: 1; background: rgba(255,255,255,0.10); color: rgba(255,255,255,0.75); font-family: 'JetBrains Mono'; font-size: 20px; padding: 8px 18px; border-radius: 999px; text-align: center; }
  .terminal-body { font-family: 'JetBrains Mono'; font-size: 24px; line-height: 1.6; color: #fff; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
  .terminal-body .cmt { color: rgba(255,255,255,0.45); }
  .terminal-body .key { color: #E8B4A0; }
  .terminal-body .val { color: #B79CF2; }
  .terminal-body .kw  { color: #FBBF77; }
  .terminal-body .str { color: #B79CF2; }
  .terminal-body .num { color: #C1DE9E; }

  /* Permission table */
  .perm-table { display: flex; flex-direction: column; gap: 16px; }
  .perm-row { display: grid; grid-template-columns: 220px 1fr; gap: 32px; align-items: center; border: 1.5px solid #1F0904; border-radius: 20px; padding: 24px 28px; }
  .perm-user { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .perm-user .avatar { width: 72px; height: 72px; position: relative; }
  .perm-user .avatar svg { width: 100%; height: 100%; stroke: #1F0904; stroke-width: 1.5; fill: none; }
  .perm-user .avatar .crown { position: absolute; bottom: -4px; right: -4px; width: 28px; height: 28px; background: #E94B19; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-family: 'Sora'; font-weight: 700; }
  .perm-user .role { font-family: 'Sora'; font-weight: 700; font-size: 26px; color: #1F0904; }
  .perm-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .perm-cell { border: 1.5px solid #1F0904; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; font-family: 'JetBrains Mono'; font-weight: 500; font-size: 22px; color: #1F0904; }
  .perm-cell .yes { color: #4E9E5C; font-size: 24px; }
  .perm-cell .no  { color: #C13B1A; font-size: 24px; }

  /* Recap checklist */
  .checklist { display: flex; flex-direction: column; gap: 20px; margin: 0; padding: 0; list-style: none; }
  .checklist li { display: flex; align-items: center; gap: 24px; font-family: 'Sora'; font-weight: 500; font-size: 40px; color: #1F0904; }
  .checklist .tick { color: #4E9E5C; font-size: 40px; line-height: 1; width: 44px; flex: none; }

  /* Illustrated scene (login-form + locked-panel mockup) */
  .scene { display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: stretch; }
  .mock { border: 1.5px solid #1F0904; border-radius: 20px; padding: 24px; background: #FDFBF6; min-height: 360px; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; }
  .mock-head { font-family: 'JetBrains Mono'; font-size: 20px; letter-spacing: 0.18em; text-transform: uppercase; color: #6E4B3E; border-bottom: 1px dashed #A48C7E; padding-bottom: 12px; }
  .mock-field { border: 1px solid #1F0904; border-radius: 12px; padding: 12px 16px; font-family: 'JetBrains Mono'; font-size: 20px; color: #6E4B3E; }
  .mock-btn { background: #E94B19; color: #fff; border-radius: 12px; padding: 12px 16px; font-family: 'Sora'; font-weight: 700; font-size: 20px; text-align: center; }
  .mock-body { display: flex; flex-direction: column; gap: 12px; }
  .mock.locked .mock-body { opacity: 0.22; filter: blur(1.5px); pointer-events: none; }
  .mock-overlay { position: absolute; inset: 0; padding: 24px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .mock-lock { display: inline-flex; align-items: center; gap: 12px; padding: 14px 22px; border-radius: 999px; background: #1F0904; color: #fff; font-family: 'JetBrains Mono'; font-weight: 500; font-size: 20px; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 12px 32px rgba(31,9,4,0.28); }
  .mock-lock svg { width: 26px; height: 26px; }
  .scene-arrow { font-family: 'JetBrains Mono'; font-size: 40px; color: #E94B19; align-self: center; }
`;
