import type { Slide, Mockup, CoverHook } from "@/lib/ds/schema";
import { fillTemplate, escapeHtml } from "@/lib/ds/fill";
import { brandMarkDataUri } from "@/lib/ds/brand";
import { coverEditorialTemplate } from "@/lib/ds/templates/cover-editorial";
import { coverCompactTemplate } from "@/lib/ds/templates/cover-compact";
import { coverBadgeTemplate } from "@/lib/ds/templates/cover-badge";
import { coverNocGridTemplate } from "@/lib/ds/templates/cover-nocgrid";
import { coverDoorTemplate } from "@/lib/ds/templates/cover-door";
import { sanitizeHookHtml } from "@/lib/ds/sanitize";
import { scopeCss } from "@/lib/ds/scope-css";
import { renderIcon } from "@/lib/ds/icons";
import { pointTemplate } from "@/lib/ds/templates/point";
import { outroTemplate } from "@/lib/ds/templates/outro";
import { terminalTemplate } from "@/lib/ds/templates/terminal";
import { comparisonTemplate } from "@/lib/ds/templates/comparison";
import { stepsTemplate, stepCardPartial } from "@/lib/ds/templates/steps";
import { calloutTemplate } from "@/lib/ds/templates/callout";
import { bigstatTemplate } from "@/lib/ds/templates/bigstat";
import { flowTemplate } from "@/lib/ds/templates/flow";
import { conceptTemplate } from "@/lib/ds/templates/concept";
import { hubTemplate } from "@/lib/ds/templates/hub";
import { checklistTemplate } from "@/lib/ds/templates/checklist";
import { browserTemplate } from "@/lib/ds/templates/browser";
import { quoteTemplate } from "@/lib/ds/templates/quote";
import { dataTableTemplate } from "@/lib/ds/templates/datatable";
import { commandListTemplate } from "@/lib/ds/templates/commandlist";
import { timelineTemplate } from "@/lib/ds/templates/timeline";
import { promptCardTemplate } from "@/lib/ds/templates/promptcard";
import { folderTreeTemplate } from "@/lib/ds/templates/foldertree";
import { commandPaletteTemplate } from "@/lib/ds/templates/commandpalette";
import { databaseTemplate } from "@/lib/ds/templates/database";
import { gitBranchTemplate } from "@/lib/ds/templates/gitbranch";
import { diagLines } from "@/lib/ds/hub-lines";
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

/** Optional `.catatan` annotation strip shared by the diagram mockups. */
function renderNote(note?: string): string {
  if (!note) return "";
  return `<div class="catatan mt-40"><div class="catatan-label">Catatan</div><div class="catatan-body">${escapeHtml(note)}</div></div>`;
}

/**
 * Replace each sentinel exactly once in a single left-to-right pass over the
 * template. Because injected content is never re-scanned, user text that
 * happens to equal another sentinel token cannot mis-target a later replace
 * (which sequential `String.replace(str, …)` calls would allow). The function
 * replacer also keeps `$`-sequences in the injected values verbatim.
 */
function injectSentinels(template: string, map: Record<string, string>): string {
  const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
  return template.replace(new RegExp(tokens.join("|"), "g"), (t) => map[t]);
}

/**
 * Render an LLM-authored HTML/CSS fragment as a proportional slide element.
 *
 * Two things every other mockup gets for free but a raw fragment does not:
 *  - a flex wrapper (`.diag-wrap` on a point, `.anchor-wrap` on a cover) so the
 *    fragment centers in the free space instead of hugging the headline;
 *  - a scope class, so its <style> block cannot restyle the slide chrome
 *    (`section`, `h1`, `.geser`) or bleed into the other slides.
 */
function renderCustomFragment(
  html: string,
  css: string | undefined,
  scopeId: string,
  wrapper: "diag-wrap" | "anchor-wrap"
): string {
  const cls = `cm-${scopeId}`;
  const styleBlock = css ? `<style>${scopeCss(css, `.${cls}`)}</style>` : "";
  // The `.cm` class makes the scope div transparent to layout (see
  // carousel-css-extra.ts) — without it the div shrink-wraps as a flex item and
  // a `width:100%` inside the fragment resolves against its own content.
  return `${styleBlock}<div class="${wrapper}"><div class="cm ${cls}">${sanitizeHookHtml(html)}</div></div>`;
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
  return base.replace("ICON_INJECT", () => renderIcon(m.icon, { size: 24, color: "#EE4B1A" }));
}

function renderBigstatMockup(m: Extract<Mockup, { type: "bigstat" }>): string {
  return fillTemplate(bigstatTemplate, {
    bigstatNumber: m.number,
    bigstatUnit: m.unit ?? "",
    bigstatCaption: m.caption,
  });
}

function renderFlowMockup(m: Extract<Mockup, { type: "flow" }>): string {
  // Each arrow is glued to the node it points AT, not left as a sibling between
  // them: the row wraps now (long chains used to overflow the canvas), and a
  // free-standing arrow would be left dangling at the end of a wrapped row
  // pointing into empty space. Grouped, every wrapped row opens with an arrow,
  // which reads as the continuation it is.
  const nodes = m.steps
    .map((s, i) => {
      const node = `<div class="node${s.focus ? " filled" : ""}">${escapeHtml(s.label)}</div>`;
      return i === 0 ? node : `<div class="flow-step"><span class="arrow">→</span>${node}</div>`;
    })
    .join("");
  return injectSentinels(flowTemplate, {
    FLOW_NODES_INJECT: nodes,
    NOTE_INJECT: renderNote(m.note),
  });
}

function renderConceptMockup(m: Extract<Mockup, { type: "concept" }>): string {
  const children = m.children.map((c) => `<div class="node">${escapeHtml(c)}</div>`).join("");
  const lines = diagLines(m.children.length, { viewH: 380, midY: 200, endY: 300 });
  return injectSentinels(conceptTemplate, {
    CONCEPT_PARENT_INJECT: escapeHtml(m.parent),
    CONCEPT_LINES_INJECT: lines,
    CONCEPT_CHILDREN_INJECT: children,
    NOTE_INJECT: renderNote(m.note),
  });
}

function renderHubMockup(m: Extract<Mockup, { type: "hub" }>): string {
  const tools = m.tools
    .map(
      (t) =>
        `<div class="tool"><div class="glyph">${renderIcon(t.icon)}</div><div class="label">${escapeHtml(t.label)}</div></div>`
    )
    .join("");
  const lines = diagLines(m.tools.length, { viewH: 400, midY: 220, endY: 320, dashed: true });
  return injectSentinels(hubTemplate, {
    HUB_CENTER_INJECT: escapeHtml(m.center),
    HUB_LINES_INJECT: lines,
    HUB_TOOLS_INJECT: tools,
    NOTE_INJECT: renderNote(m.note),
  });
}

function renderChecklistMockup(m: Extract<Mockup, { type: "checklist" }>): string {
  const items = m.items
    .map((i) => `<li><span class="tick">✓</span> ${escapeHtml(i)}</li>`)
    .join("");
  return injectSentinels(checklistTemplate, {
    CHECKLIST_ITEMS_INJECT: items,
    NOTE_INJECT: renderNote(m.note),
  });
}

function renderBrowserMockup(m: Extract<Mockup, { type: "browser" }>): string {
  const cards = m.cards
    .map(
      (c) =>
        `<div class="b-card"><div class="t">${escapeHtml(c.value)}</div><div class="s">${escapeHtml(c.label)}</div></div>`
    )
    .join("");
  return injectSentinels(browserTemplate, {
    BROWSER_URL_INJECT: escapeHtml(m.url),
    BROWSER_CARDS_INJECT: cards,
    NOTE_INJECT: renderNote(m.note),
  });
}

function renderQuoteMockup(m: Extract<Mockup, { type: "quote" }>): string {
  return fillTemplate(quoteTemplate, { quote: m.quote, author: m.author ?? "" });
}

function renderDataTableMockup(m: Extract<Mockup, { type: "datatable" }>): string {
  const rows = m.rows
    .map(
      (r) =>
        `<div class="dt-row"><div class="c">${escapeHtml(r.no)}</div><div class="c b">${escapeHtml(r.ok)}</div></div>`
    )
    .join("");
  return injectSentinels(dataTableTemplate, {
    DT_NO_INJECT: escapeHtml(m.noLabel),
    DT_OK_INJECT: escapeHtml(m.okLabel),
    DT_ROWS_INJECT: rows,
  });
}

function renderCommandListMockup(m: Extract<Mockup, { type: "commandlist" }>): string {
  const rows = m.rows
    .map(
      (r) =>
        `<div class="row"><span class="cmd">${escapeHtml(r.cmd)}</span><span class="desc">${escapeHtml(r.desc)}</span></div>`
    )
    .join("");
  return injectSentinels(commandListTemplate, {
    CLIST_ROWS_INJECT: rows,
    NOTE_INJECT: renderNote(m.note),
  });
}

function renderTimelineMockup(m: Extract<Mockup, { type: "timeline" }>): string {
  return fillTemplate(timelineTemplate, {
    oldLabel: m.oldLabel,
    oldTitle: m.oldTitle,
    oldBody: m.oldBody,
    newLabel: m.newLabel,
    newTitle: m.newTitle,
    newBody: m.newBody,
  });
}

function renderPromptcardMockup(m: Extract<Mockup, { type: "promptcard" }>): string {
  return fillTemplate(promptCardTemplate, { label: m.label, body: m.body });
}

function renderFolderTreeMockup(m: Extract<Mockup, { type: "foldertree" }>): string {
  const lines = m.lines
    .map((l) => {
      const escaped = escapeHtml(l.text);
      return l.active ? `<span class="on">${escaped}</span>` : escaped;
    })
    .join("\n");
  // Function replacer keeps $-sequences in path text verbatim.
  return folderTreeTemplate.replace("TREE_LINES_INJECT", () => lines);
}

function renderCommandPaletteMockup(m: Extract<Mockup, { type: "commandpalette" }>): string {
  const rows = m.rows
    .map((r) => {
      const icon = renderIcon(r.icon, { size: 28, color: "#FF6A3D" });
      const key = r.active ? `<span class="k">↵</span>` : "";
      return `<div class="row${r.active ? " on" : ""}">${icon}${escapeHtml(r.label)}${key}</div>`;
    })
    .join("");
  return injectSentinels(commandPaletteTemplate, {
    CMDP_QUERY_INJECT: escapeHtml(m.query),
    CMDP_ROWS_INJECT: rows,
  });
}

function renderDatabaseMockup(m: Extract<Mockup, { type: "database" }>): string {
  const headIcon = renderIcon("database", { size: 26, color: "#F7F1E8" });
  const renderTable = (t: (typeof m.tables)[number]) => {
    const rows = t.rows
      .map(
        (r) =>
          `<div class="tr"><span>${escapeHtml(r.col)}</span><span class="ty">${escapeHtml(r.type)}</span></div>`
      )
      .join("");
    return `<div class="table"><div class="th">${headIcon}${escapeHtml(t.name)}</div>${rows}</div>`;
  };
  const [a, b] = m.tables;
  const tables = `${renderTable(a)}<span class="rel">${escapeHtml(m.relation)}</span>${renderTable(b)}`;
  // Function replacer keeps $-sequences in column text verbatim.
  return databaseTemplate.replace("DB_TABLES_INJECT", () => tables);
}

function renderGitBranchMockup(m: Extract<Mockup, { type: "gitbranch" }>): string {
  return injectSentinels(gitBranchTemplate, {
    GIT_BRANCH_INJECT: escapeHtml(m.branch.name),
    GIT_MERGE_INJECT: escapeHtml(m.mergeLabel),
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
// .anchor-wrap (not .diag-wrap) so the image centers in the cover's free space
// exactly like the badge/nocgrid/door anchors do.
function renderImageHook(h: Extract<CoverHook, { kind: "image" }>): string {
  const src = escapeHtml(h.src);
  return `<div class="anchor-wrap"><img src="${src}" alt="" style="max-width:100%; max-height:100%; border-radius:20px;"></div>`;
}

function renderBadgeHook(h: Extract<CoverHook, { kind: "badge" }>): string {
  const gitIcon = renderIcon("git-branch", { size: 24, color: "#FF6A3D" });
  const sub = h.sub ? `<div class="sub">${escapeHtml(h.sub)}</div>` : "";
  const strike = h.struck ? `<div class="cover-strike"></div>` : "";
  return coverBadgeTemplate
    .replace("BADGE_BROW_INJECT", () => `${gitIcon}${escapeHtml(h.eyebrowLine ?? "ID · 2026")}`)
    .replace("BADGE_ROLE_INJECT", () => escapeHtml(h.role))
    .replace("BADGE_SUB_INJECT", () => sub)
    .replace("BADGE_STRIKE_INJECT", () => strike);
}

function renderNocGridHook(h: Extract<CoverHook, { kind: "nocgrid" }>): string {
  const cols = h.cols ?? 6;
  const rows = h.rows ?? 3;
  const down = (h.state ?? "down") === "down";
  const banner = h.banner ?? "100% PACKET LOSS";
  // Slugs MUST be in the icons allowlist or renderIcon falls back to "sparkles".
  const nodeIcon = renderIcon(down ? "x-circle" : "check-circle", { size: 34, color: down ? "#FF5A4D" : "#4E9E5C" });
  const nodes = Array.from({ length: cols * rows })
    .map(() => `<span class="node ${down ? "down" : "up"}">${nodeIcon}</span>`)
    .join("");
  const bannerIcon = renderIcon(down ? "alert-triangle" : "check-circle", { size: 40, color: down ? "#FF5A4D" : "#4E9E5C" });
  return coverNocGridTemplate
    .replace("GRID_COLS_INJECT", () => String(cols))
    .replace("NODES_INJECT", () => nodes)
    .replace("BANNER_INJECT", () => `${bannerIcon}${escapeHtml(banner)}`);
}

function renderDoorHook(h: Extract<CoverHook, { kind: "door" }>): string {
  // "hand"/"pointer" are NOT in the icon allowlist; arrow-right is verified present
  // and reads as the (wrong) push direction the label demands.
  const handIcon = renderIcon("arrow-right", { size: 96, color: "#FF6A3D" });
  const handle = h.pull === false ? "" : `<div class="handle"></div>`;
  return coverDoorTemplate
    .replace("LABEL_INJECT", () => escapeHtml(h.label ?? "DORONG"))
    .replace("HANDLE_INJECT", () => handle)
    .replace("HAND_INJECT", () => handIcon);
}

/** Render any mockup type to an HTML fragment. `scopeId` scopes `custom` CSS. */
function renderMockup(m: Mockup, scopeId: string): string {
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
    case "flow":
      return renderFlowMockup(m);
    case "concept":
      return renderConceptMockup(m);
    case "hub":
      return renderHubMockup(m);
    case "checklist":
      return renderChecklistMockup(m);
    case "browser":
      return renderBrowserMockup(m);
    case "quote":
      return renderQuoteMockup(m);
    case "datatable":
      return renderDataTableMockup(m);
    case "commandlist":
      return renderCommandListMockup(m);
    case "timeline":
      return renderTimelineMockup(m);
    case "promptcard":
      return renderPromptcardMockup(m);
    case "foldertree":
      return renderFolderTreeMockup(m);
    case "commandpalette":
      return renderCommandPaletteMockup(m);
    case "database":
      return renderDatabaseMockup(m);
    case "gitbranch":
      return renderGitBranchMockup(m);
    case "custom":
      return renderCustomFragment(m.html, m.css, scopeId, "diag-wrap");
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

export function renderSlide(slide: Slide, slideIndex = 0): string {
  const brand = brandMarkDataUri;
  const scopeId = String(slideIndex);
  switch (slide.role) {
    case "cover": {
      // The series stamp is part of the cover anatomy (DESIGN.md §16), so it is
      // defaulted rather than left blank when the model omits it.
      const stamp = slide.stamp ?? "Engineering Notes";
      if (!slide.hook) {
        const base = fillTemplate(coverEditorialTemplate, {
          brand,
          coverSurface: "cover-ink",
          eyebrow: slide.eyebrow,
          stamp,
          ...splitHeadline(slide.headline, slide.accentWord),
          lede: slide.lede ?? "",
        });
        // Ghost index numeral anchors the eye at the hook (motivated, not decor).
        // Function replacer keeps any $-sequence in the numeral verbatim.
        const numeral = escapeHtml(slide.ghostNumeral ?? "01");
        return base.replace("GHOST_NUMERAL_INJECT", () => numeral);
      }
      const h = slide.hook;
      let fragment = "";
      if (h.kind === "device") fragment = renderDeviceHook(h);
      else if (h.kind === "custom")
        fragment = renderCustomFragment(h.html, h.css, scopeId, "anchor-wrap");
      else if (h.kind === "image") fragment = renderImageHook(h);
      else if (h.kind === "badge") fragment = renderBadgeHook(h);
      else if (h.kind === "nocgrid") fragment = renderNocGridHook(h);
      else if (h.kind === "door") fragment = renderDoorHook(h);
      const base = fillTemplate(coverCompactTemplate, {
        brand,
        coverSurface: "ink cover-ink",
        eyebrow: slide.eyebrow,
        stamp,
        ...splitHeadline(slide.headline, slide.accentWord),
        lede: slide.lede ?? "",
      });
      // Function replacer: a bare string would let $-sequences ($$, $&, $`, $')
      // in hook fragments be interpreted by String.replace and corrupt output.
      return base.replace("HOOK_INJECT", () => fragment);
    }
    case "point": {
      const mockup = resolveMockup(slide);
      // Ink is the deck default now; "paper" is the explicit opt-out class.
      const surfaceClass = slide.surface === "paper" ? "paper" : "";

      // For card-type mockups, render via the point template's built-in {{#card}} block
      if (mockup.type === "card") {
        const filled = fillTemplate(pointTemplate, {
          brand,
          surfaceClass,
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
          renderIcon(mockup.icon, { size: 24, color: "#EE4B1A" })
        );
      }

      // For non-card mockups, render the mockup fragment and inject it after the body
      const mockupHtml = renderMockup(mockup, scopeId);
      const base = fillTemplate(pointTemplate, {
        brand,
        surfaceClass,
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
      // Ink is the deck default now; "paper" is the explicit opt-out class.
      const surfaceClass = slide.surface === "paper" ? "paper" : "";
      return fillTemplate(outroTemplate, {
        brand,
        surfaceClass,
        eyebrow: slide.eyebrow ?? "",
        ...splitHeadline(slide.headline, slide.accentWord),
        body: slide.body ?? "",
        ctaStrong: cta.strong,
        ctaSub: cta.sub ?? "",
      });
    }
  }
}
