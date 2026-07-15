// Verbatim <section> markup for the cover role, copied from
// "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" (§ "SLIDE 1 · COVER").
// [bracket] placeholders rewritten as {{slot}} markers matching Slide["cover"] fields.
export const coverTemplate = String.raw`<section data-screen-label="01 · Cover">
  <div class="brand-row">
    <div class="brand-disc">
      <img src="{{brand}}" alt="@vourdev">
    </div>
    <span class="brand-handle">@vourdev</span>
  </div>

  <div class="eyebrow mt-64">{{eyebrow}}</div>
  <h1 class="hero mt-24">{{headlinePre}}<span class="a">{{accentWord}}</span>{{headlinePost}}</h1>
  {{#lede}}
  <p class="lede mt-32">
    {{lede}}
  </p>
  {{/lede}}

  <div class="geser">Geser →</div>
</section>`;
