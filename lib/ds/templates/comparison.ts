// Comparison bars mockup — two stacked panels: loser (stone) vs winner (peach).
// Adapted from "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" (§ "D4 · Comparison bars").
export const comparisonTemplate = String.raw`<div class="diag-wrap mt-40">
    <div class="diag-bars" style="width:100%">
    <div class="panel loser">
      <div class="h">{{compLoserLabel}}</div>
      <div class="rows">
        <div class="bar dim" style="width:60%"></div>
        <div class="bar dim" style="width:72%"></div>
        <div class="bar faded" style="width:48%"></div>
      </div>
      <div class="foot">{{compLoserLine}}</div>
    </div>
    <div class="panel">
      <div class="h">{{compWinnerLabel}}</div>
      <div class="rows">
        <div class="bar" style="width:100%"></div>
        <div class="bar" style="width:100%"></div>
        <div class="bar" style="width:100%"></div>
        <div class="bar" style="width:100%"></div>
      </div>
      <div class="foot">{{compWinnerLine}}</div>
    </div>
  </div>
  {{#compRationale}}
  <div class="catatan mt-24">
    <div class="catatan-label">Catatan</div>
    <div class="catatan-body">{{compRationale}}</div>
  </div>
  {{/compRationale}}
  </div>`;
