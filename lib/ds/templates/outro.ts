// Verbatim <section> markup for the outro role, copied from
// "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" (§ "SLIDE · OUTRO").
// [bracket] placeholders rewritten as {{slot}} markers matching Slide["outro"] fields.
// The source section also carries a counter/eyebrow/CTA-highlight block that has no
// counterpart in the outro schema (role, headline, accentWord?, body?) — those
// non-data-driven elements are dropped so every {{slot}} here matches a var
// renderSlide actually produces.
export const outroTemplate = String.raw`<section data-screen-label="08 · Outro">
  <h1 class="mt-24">{{headlinePre}}<span class="a">{{accentWord}}</span>{{headlinePost}}</h1>
  {{#body}}
  <p class="body-text mt-32">
    {{body}}
  </p>
  {{/body}}

  <div class="brand-row" style="margin-top:auto; padding-top:32px;">
    <div class="brand-disc">
      <img src="{{brand}}" alt="@vourdev">
    </div>
    <span class="brand-handle">@vourdev</span>
  </div>
</section>`;
