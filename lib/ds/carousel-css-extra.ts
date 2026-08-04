// Additive carousel styles that must NOT live in the verbatim DS-bundle block
// (lib/ds/carousel-css.ts is marked DO NOT EDIT). Appended after it in assemble.
export const carouselExtraCss = String.raw`
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
`;
