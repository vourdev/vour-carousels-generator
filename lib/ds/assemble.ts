import type { SlidePlan } from "@/lib/ds/schema";
import { renderSlide } from "@/lib/ds/render-slide";
import { carouselCss } from "@/lib/ds/carousel-css";

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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Nunito:wght@500;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
<script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>
<script type="application/json" id="vourdev-meta">
${meta}
</script>
<style>${carouselCss}</style>
</head>
<body>
${body}
</body>
</html>`;
}
