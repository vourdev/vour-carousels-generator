// Numbered step cards mockup — orange-circled step badges.
// Adapted from "design-system" NumberedStep component + Solution recipe.
// Steps are injected as raw HTML via STEPS_HTML_INJECT sentinel.
export const stepsTemplate = String.raw`<div class="diag-wrap mt-40">
    <div style="display:flex;flex-direction:column;gap:16px;width:100%">STEPS_HTML_INJECT</div>
  </div>`;

// Single step card partial — used by render-slide.ts to build stepsHtml.
export const stepCardPartial = String.raw`<div class="card card-amber" style="padding:18px 22px;display:flex;align-items:flex-start;gap:16px">
      <div style="min-width:36px;height:36px;border-radius:50%;background:#EE4B1A;color:#FFF;display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-weight:700;font-size:18px;flex:none">{{stepN}}</div>
      <div>
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:26px;color:#1C0A05;line-height:1.2">{{stepTitle}}</div>
        <div style="font-family:'Inter',sans-serif;font-weight:500;font-size:22px;color:#6E4B3E;margin-top:4px;line-height:1.3">{{stepBody}}</div>
      </div>
    </div>`;
