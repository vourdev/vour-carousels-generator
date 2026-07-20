// DarkCallout mockup — dark banner with icon for key takeaways.
// Adapted from "Vour Dev Design System" DarkCallout component.
export const calloutTemplate = String.raw`<div class="diag-wrap mt-40">
    <div style="background:#1F0904;border-radius:20px;padding:28px 32px;display:flex;align-items:flex-start;gap:20px;width:100%">
      <div style="min-width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center">
        <iconify-icon icon="{{calloutIcon}}" style="font-size:24px;color:#E94B19;"></iconify-icon>
      </div>
      <div style="font-family:'Nunito',sans-serif;font-weight:600;font-size:30px;color:#FAF5EF;line-height:1.4">{{calloutText}}</div>
    </div>
  </div>`;
