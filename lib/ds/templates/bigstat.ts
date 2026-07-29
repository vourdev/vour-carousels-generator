// BigStat mockup — one standout metric in editorial style.
// Adapted from "design-system" BigStat component.
export const bigstatTemplate = String.raw`<div class="diag-wrap mt-40">
    <div style="text-align:center;width:100%;padding:24px 0">
      <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:96px;color:#E94B19;line-height:1">{{bigstatNumber}}</div>
      {{#bigstatUnit}}
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:40px;color:#1F0904;margin-top:8px;line-height:1.2">{{bigstatUnit}}</div>
      {{/bigstatUnit}}
      <div style="font-family:'Nunito',sans-serif;font-weight:500;font-size:32px;color:#7A6A5E;margin-top:16px;line-height:1.3;max-width:800px;margin-left:auto;margin-right:auto">{{bigstatCaption}}</div>
    </div>
  </div>`;
