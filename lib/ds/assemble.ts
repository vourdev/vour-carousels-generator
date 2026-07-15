import type { SlidePlan } from "@/lib/ds/schema";
import { renderSlide } from "@/lib/ds/render-slide";
import { carouselCss } from "@/lib/ds/carousel-css";
import { inlineFontFaceCss } from "@/lib/ds/fonts-inline";

export function assembleCarousel(plan: SlidePlan): string {
  const { title, caption, hashtags, slides } = plan;
  const meta = JSON.stringify(
    { title, caption, hashtags },
    null,
    2
  );
  const body = slides.map(renderSlide).join("\n");
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>
<script type="application/json" id="vourdev-meta">
${meta}
</script>
<style>${inlineFontFaceCss}</style>
<style>${carouselCss}</style>
</head>
<body>
${body}
</body>
</html>`;
}
