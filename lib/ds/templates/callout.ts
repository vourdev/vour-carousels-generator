// DarkCallout mockup — dark banner with icon for key takeaways.
// Adapted from "design-system" DarkCallout component.
export const calloutTemplate = String.raw`<div class="diag-wrap mt-40">
    <div style="background:#14110E;border-radius:20px;padding:26px 30px;display:flex;align-items:flex-start;gap:20px;width:100%">
      <div style="min-width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;flex:none">
        ICON_INJECT
      </div>
      <div style="font-family:'Inter',sans-serif;font-weight:600;font-size:26px;color:#F7F1E8;line-height:1.4;word-break:break-word">{{calloutText}}</div>
    </div>
  </div>`;
