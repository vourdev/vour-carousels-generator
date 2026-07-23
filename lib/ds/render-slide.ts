import type { Slide, Mockup, CoverHook } from "@/lib/ds/schema";
import { fillTemplate, escapeHtml } from "@/lib/ds/fill";
import { brandMarkDataUri } from "@/lib/ds/brand";
import { coverTemplate } from "@/lib/ds/templates/cover";
import { coverCompactTemplate } from "@/lib/ds/templates/cover-compact";
import { sanitizeHookHtml } from "@/lib/ds/sanitize";
import { renderIcon } from "@/lib/ds/icons";
import { pointTemplate } from "@/lib/ds/templates/point";
import { outroTemplate } from "@/lib/ds/templates/outro";
import { terminalTemplate } from "@/lib/ds/templates/terminal";
import { comparisonTemplate } from "@/lib/ds/templates/comparison";
import { stepsTemplate, stepCardPartial } from "@/lib/ds/templates/steps";
import { calloutTemplate } from "@/lib/ds/templates/callout";
import { bigstatTemplate } from "@/lib/ds/templates/bigstat";
import { deviceTemplate } from "@/lib/ds/templates/device";

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

/* ── Mockup renderers ─────────────────────────────────────────── */

function renderTerminalMockup(m: Extract<Mockup, { type: "terminal" }>): string {
  const terminalLines = m.lines
    .map((l) => {
      const escaped = escapeHtml(l.text);
      if (l.style === "plain" || !l.style) return escaped;
      return `<span class="${l.style}">${escaped}</span>`;
    })
    .join("\n");
  const base = fillTemplate(terminalTemplate, {
    terminalFilename: m.filename,
  });
  // Function replacer: a bare string lets $-sequences ($$, $&, $`, $') in code
  // lines be interpreted by String.replace and corrupt output.
  return base.replace("TERMINAL_LINES_INJECT", () => terminalLines);
}

function renderComparisonMockup(m: Extract<Mockup, { type: "comparison" }>): string {
  return fillTemplate(comparisonTemplate, {
    compLoserLabel: m.loserLabel,
    compLoserLine: m.loserLine,
    compWinnerLabel: m.winnerLabel,
    compWinnerLine: m.winnerLine,
    compRationale: m.winnerRationale ?? "",
  });
}

function renderStepsMockup(m: Extract<Mockup, { type: "steps" }>): string {
  const stepsHtml = m.items
    .map((s, i) =>
      fillTemplate(stepCardPartial, {
        stepN: String(i + 1),
        stepTitle: s.title,
        stepBody: s.body,
      })
    )
    .join("\n");
  // Function replacer: a bare string lets $-sequences in step copy be
  // interpreted by String.replace and corrupt output.
  return stepsTemplate.replace("STEPS_HTML_INJECT", () => stepsHtml);
}

function renderCalloutMockup(m: Extract<Mockup, { type: "callout" }>): string {
  const base = fillTemplate(calloutTemplate, {
    calloutText: m.text,
  });
  // Function replacer: keep raw SVG out of String.replace $-interpretation.
  return base.replace("ICON_INJECT", () => renderIcon(m.icon, { size: 24, color: "#E94B19" }));
}

function renderBigstatMockup(m: Extract<Mockup, { type: "bigstat" }>): string {
  return fillTemplate(bigstatTemplate, {
    bigstatNumber: m.number,
    bigstatUnit: m.unit ?? "",
    bigstatCaption: m.caption,
  });
}

export function renderDeviceHook(h: Extract<CoverHook, { kind: "device" }>): string {
  const bodyLines = h.lines
    .map((l) => {
      const escaped = escapeHtml(l.text);
      return l.style && l.style !== "plain" ? `<span class="${l.style}">${escaped}</span>` : escaped;
    })
    .join("\n");
  const labelHtml = h.label
    ? h.chrome === "browser"
      ? `<span class="urlbar">${escapeHtml(h.label)}</span>`
      : `<span class="title">${escapeHtml(h.label)}</span>`
    : "";
  return deviceTemplate
    .replace("BAR_LABEL_INJECT", () => labelHtml)
    .replace("DEVICE_LINES_INJECT", () => bodyLines);
}

// Phase-2 refinement pending (ImagePlate styling). Minimal, escaped, safe today.
function renderImageHook(h: Extract<CoverHook, { kind: "image" }>): string {
  const src = escapeHtml(h.src);
  return `<div class="diag-wrap mt-40"><img src="${src}" alt="" style="max-width:100%; border-radius:20px;"></div>`;
}

/** Render any mockup type to an HTML fragment. */
function renderMockup(m: Mockup): string {
  switch (m.type) {
    case "terminal":
      return renderTerminalMockup(m);
    case "comparison":
      return renderComparisonMockup(m);
    case "steps":
      return renderStepsMockup(m);
    case "callout":
      return renderCalloutMockup(m);
    case "bigstat":
      return renderBigstatMockup(m);
    case "card":
      // Card is rendered inline via the point template's {{#card}} block, not here.
      return "";
  }
}

/**
 * Resolve the effective mockup for a point slide.
 * Priority: slide.mockup > slide.card (wrapped as card type) > auto-fallback.
 */
function resolveMockup(slide: Extract<Slide, { role: "point" }>): Mockup {
  if (slide.mockup) return slide.mockup;
  if (slide.card) return { type: "card" as const, ...slide.card };
  // Auto-fallback: generate a card from slide data so no slide is ever flat
  return {
    type: "card" as const,
    icon: "sparkles",
    title: slide.eyebrow || "Ringkasan",
    body: slide.body,
    tone: "peach" as const,
  };
}

/* ── Main render ──────────────────────────────────────────────── */

export function renderSlide(slide: Slide): string {
  const brand = brandMarkDataUri;
  switch (slide.role) {
    case "cover": {
      if (!slide.hook) {
        return fillTemplate(coverTemplate, {
          brand,
          eyebrow: slide.eyebrow,
          ...splitHeadline(slide.headline, slide.accentWord),
          lede: slide.lede ?? "",
        });
      }
      const h = slide.hook;
      let fragment = "";
      if (h.kind === "device") fragment = renderDeviceHook(h);
      else if (h.kind === "custom") fragment = sanitizeHookHtml(h.html);
      else if (h.kind === "image") fragment = renderImageHook(h);
      const base = fillTemplate(coverCompactTemplate, {
        brand,
        eyebrow: slide.eyebrow,
        ...splitHeadline(slide.headline, slide.accentWord),
        lede: slide.lede ?? "",
      });
      // Function replacer: a bare string would let $-sequences ($$, $&, $`, $')
      // in hook fragments be interpreted by String.replace and corrupt output.
      return base.replace("HOOK_INJECT", () => fragment);
    }
    case "point": {
      const mockup = resolveMockup(slide);

      // For card-type mockups, render via the point template's built-in {{#card}} block
      if (mockup.type === "card") {
        const filled = fillTemplate(pointTemplate, {
          brand,
          counter: slide.counter,
          eyebrow: slide.eyebrow,
          ...splitHeadline(slide.headline, slide.accentWord),
          body: slide.body,
          card: "1",
          cardTitle: mockup.title || slide.eyebrow || "Ringkasan",
          cardBody: mockup.body || slide.body,
          cardTone: mockup.tone || "peach",
          mockupHtml: "",
        });
        // Function replacer keeps raw SVG safe from $-sequence interpretation.
        return filled.replace("ICON_INJECT", () =>
          renderIcon(mockup.icon, { size: 24, color: "#E94B19" })
        );
      }

      // For non-card mockups, render the mockup fragment and inject it after the body
      const mockupHtml = renderMockup(mockup);
      const base = fillTemplate(pointTemplate, {
        brand,
        counter: slide.counter,
        eyebrow: slide.eyebrow,
        ...splitHeadline(slide.headline, slide.accentWord),
        body: slide.body,
        card: "",  // hide the card block
        cardTitle: "",
        cardBody: "",
        cardTone: "peach",
        mockupHtml: "1",  // truthy to activate the block
      });
      // Replace the sentinel with raw (unescaped) mockup HTML
      // Function replacer: a bare string lets $-sequences in mockup content
      // (code lines, step copy) be interpreted by String.replace and corrupt output.
      return base.replace("MOCKUP_INJECT", () => mockupHtml);
    }
    case "outro": {
      const cta = slide.cta ?? { strong: "" };
      return fillTemplate(outroTemplate, {
        brand,
        eyebrow: slide.eyebrow ?? "",
        ...splitHeadline(slide.headline, slide.accentWord),
        body: slide.body ?? "",
        ctaStrong: cta.strong,
        ctaSub: cta.sub ?? "",
      });
    }
  }
}
