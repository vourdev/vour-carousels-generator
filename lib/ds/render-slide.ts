import type { Slide } from "@/lib/ds/schema";
import { fillTemplate } from "@/lib/ds/fill";
import { brandMarkDataUri } from "@/lib/ds/brand";
import { coverTemplate } from "@/lib/ds/templates/cover";
import { pointTemplate } from "@/lib/ds/templates/point";
import { outroTemplate } from "@/lib/ds/templates/outro";

function splitHeadline(headline: string, accentWord?: string) {
  if (!accentWord) return { headlinePre: headline, accentWord: "", headlinePost: "" };
  const i = headline.indexOf(accentWord);
  if (i < 0) return { headlinePre: headline, accentWord: "", headlinePost: "" };
  return {
    headlinePre: headline.slice(0, i),
    accentWord,
    headlinePost: headline.slice(i + accentWord.length),
  };
}

export function renderSlide(slide: Slide): string {
  const brand = brandMarkDataUri;
  switch (slide.role) {
    case "cover":
      return fillTemplate(coverTemplate, {
        brand,
        eyebrow: slide.eyebrow,
        ...splitHeadline(slide.headline, slide.accentWord),
        lede: slide.lede ?? "",
      });
    case "point":
      return fillTemplate(pointTemplate, {
        brand,
        counter: slide.counter,
        eyebrow: slide.eyebrow,
        ...splitHeadline(slide.headline, slide.accentWord),
        body: slide.body,
        card: slide.card ? "1" : "",
        cardIcon: slide.card?.icon ?? "",
        cardTitle: slide.card?.title ?? "",
        cardBody: slide.card?.body ?? "",
        cardTone: slide.card?.tone ?? "peach",
      });
    case "outro":
      return fillTemplate(outroTemplate, {
        brand,
        ...splitHeadline(slide.headline, slide.accentWord),
        body: slide.body ?? "",
      });
  }
}
