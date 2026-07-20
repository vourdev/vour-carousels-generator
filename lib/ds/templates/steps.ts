// Numbered step cards mockup — orange-circled step badges.
// Adapted from "Vour Dev Design System" NumberedStep component + Solution recipe.
// Steps are injected as raw HTML via STEPS_HTML_INJECT sentinel.
export const stepsTemplate = String.raw`<div class="diag-wrap mt-40">
    <div style="display:flex;flex-direction:column;gap:16px;width:100%">STEPS_HTML_INJECT</div>
  </div>`;

// Single step card partial — used by render-slide.ts to build stepsHtml.
export const stepCardPartial = String.raw`<div class="card card-amber" style="padding:20px 24px;display:flex;align-items:flex-start;gap:16px">
      <div style="min-width:40px;height:40px;border-radius:50%;background:#E94B19;color:#FFF;display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-weight:700;font-size:20px">{{stepN}}</div>
      <div>
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:32px;color:#1F0904;line-height:1.2">{{stepTitle}}</div>
        <div style="font-family:'Nunito',sans-serif;font-weight:500;font-size:28px;color:#7A6A5E;margin-top:6px;line-height:1.3">{{stepBody}}</div>
      </div>
    </div>`;
