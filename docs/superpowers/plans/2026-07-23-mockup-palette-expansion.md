# Mockup Palette Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new carousel mockup types — flow-chain, icon-hub, concept-hub, recap-checklist — wired from the existing DS bundle, and steer the AI to pick mockups by slide context instead of over-using the terminal.

**Architecture:** Each new mockup is a `point`-slide fragment following the existing `comparison`/`terminal` pattern: a new member in `mockupSchema`, a template copied verbatim from `TEMPLATE-editorial-v3.html` with repeated regions as raw-inject sentinels, a render function, and a `renderMockup` switch case (added together so `tsc` exhaustiveness stays green). Hub/concept share one connector-SVG helper; hub tool glyphs reuse the inline-SVG icon allowlist. No CSS changes — all classes already ship in `lib/ds/carousel-css.ts`.

**Tech Stack:** TypeScript, Zod, Vitest, existing `lib/ds` render pipeline, `renderIcon` from `lib/ds/icons`.

## Global Constraints

- Fixed **1080×1350** canvas; copy budgets: flow step ≤24, hub center ≤20 / tool label ≤16, concept parent ≤20 / child ≤18, checklist item ≤48, `note` ≤90 chars.
- Hub and concept support **exactly 3 or 4** nodes (matches the generated connector geometry).
- All icons come from the allowlist via `iconField` (`z.string().transform(normalizeIcon)`, fallback `sparkles`) — never free-form.
- Reuse the existing raw-inject pattern: `template.replace("SENTINEL", () => html)` with a **function replacer** (protects `$`-sequences); escape all user text with `escapeHtml`.
- No CSS edits (`lib/ds/carousel-css.ts` is verbatim DS-bundle, DO NOT EDIT); classes `.diag-flow`, `.diag-hub`, `.diag-icon-hub`, `.checklist`, `.catatan`, `.node(.filled/.big)`, `.arrow`, `.children`, `.tools`, `.tool`, `.glyph`, `.label`, `.tick`, `.center`, `.lines` already exist.
- Each new schema member and its `renderMockup` switch case land in the SAME task so the tree type-checks between tasks.
- Test runner: `npm test` (`vitest run`); typecheck `npx tsc --noEmit`; lint changed files with `npx eslint <files>`.
- AGENTS.md: no App Router surface here; consult `node_modules/next/dist/docs/` only if that changes.

**Canonical component markup** (copied from `Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html`, D1/D2/D5/D9) — fragments below drop the section/counter/eyebrow/headline/body (the point template already supplies those) and keep the `.diag-wrap` block + optional `.catatan`.

---

### Task 1: Connector-SVG helper (`diagLines`)

**Files:**
- Create: `lib/ds/hub-lines.ts`
- Test: `test/ds/hub-lines.test.ts`

**Interfaces:**
- Produces: `export function diagLines(count: number, o: { viewH: number; midY: number; endY: number }): string` — returns an `<svg class="lines" …>` with one `<path>` + one `<polygon>` per node. Supports 3 or 4 nodes (any other count clamps to 4).

- [ ] **Step 1: Write the failing test**

Create `test/ds/hub-lines.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { diagLines } from "@/lib/ds/hub-lines";

describe("diagLines", () => {
  it("draws 4 paths + 4 arrowheads for 4 nodes", () => {
    const svg = diagLines(4, { viewH: 400, midY: 220, endY: 320 });
    expect((svg.match(/<path /g) ?? []).length).toBe(4);
    expect((svg.match(/<polygon /g) ?? []).length).toBe(4);
    expect(svg).toContain('viewBox="0 0 920 400"');
    expect(svg).toContain("M 460 96");
  });
  it("draws 3 paths + 3 arrowheads for 3 nodes", () => {
    const svg = diagLines(3, { viewH: 380, midY: 200, endY: 300 });
    expect((svg.match(/<path /g) ?? []).length).toBe(3);
    expect((svg.match(/<polygon /g) ?? []).length).toBe(3);
    expect(svg).toContain('viewBox="0 0 920 380"');
  });
  it("clamps an out-of-range count to 4", () => {
    const svg = diagLines(2, { viewH: 400, midY: 220, endY: 320 });
    expect((svg.match(/<path /g) ?? []).length).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/ds/hub-lines.test.ts`
Expected: FAIL — cannot resolve `@/lib/ds/hub-lines`.

- [ ] **Step 3: Write the implementation**

Create `lib/ds/hub-lines.ts`:

```ts
/** Generate the curved connector SVG (center → N nodes) for the hub/concept
    diagrams. Endpoints match the flexbox space-between layout of `.children` /
    `.tools`. Supports 3 or 4 nodes; anything else clamps to 4. */
export function diagLines(
  count: number,
  o: { viewH: number; midY: number; endY: number }
): string {
  const n = count === 3 ? 3 : 4;
  const xs = n === 3 ? [110, 460, 810] : [110, 343, 577, 810];
  const headTop = o.endY - 4;
  const headBot = o.endY + 8;
  const paths = xs
    .map((x) => `<path class="stroke" d="M 460 96 Q 460 ${o.midY} ${x} ${o.endY}" />`)
    .join("");
  const heads = xs
    .map(
      (x) =>
        `<polygon class="head" points="${x - 8},${headTop} ${x + 8},${headTop} ${x},${headBot}" />`
    )
    .join("");
  return `<svg class="lines" viewBox="0 0 920 ${o.viewH}" preserveAspectRatio="none">${paths}${heads}</svg>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/ds/hub-lines.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ds/hub-lines.ts test/ds/hub-lines.test.ts
git commit -m "feat(ds): connector-SVG helper for hub/concept diagrams"
```

---

### Task 2: `flow` mockup (+ shared note helper)

**Files:**
- Create: `lib/ds/templates/flow.ts`
- Modify: `lib/ds/schema.ts` (add `mockupFlow`, extend union)
- Modify: `lib/ds/render-slide.ts` (import, `renderNote`, `renderFlowMockup`, switch case)
- Test: `test/ds/schema.test.ts`, `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `escapeHtml` (already imported in render-slide).
- Produces: mockup `{ type:"flow", steps:[{label,focus?}](2–5), note?}`; `renderNote(note?: string): string` (shared by later tasks); `flowTemplate`.

- [ ] **Step 1: Write the failing tests**

Add to `test/ds/schema.test.ts` (inside a new describe at end of file):

```ts
describe("flow mockup", () => {
  it("parses a flow with focus + note", () => {
    const m = mockupSchema.parse({
      type: "flow",
      steps: [{ label: "Request" }, { label: "Handler", focus: true }, { label: "DB" }],
      note: "Alur request masuk.",
    });
    expect(m.type).toBe("flow");
  });
  it("rejects a flow with 1 step (min 2)", () => {
    expect(() => mockupSchema.parse({ type: "flow", steps: [{ label: "x" }] })).toThrow();
  });
});
```

Add to `test/ds/render-slide.test.ts` (inside the `describe("renderSlide", …)` block):

```ts
  it("renders a flow mockup with nodes and arrows", () => {
    const html = renderSlide({
      role: "point", counter: "02/07", eyebrow: "ALUR", headline: "Flow", body: "desc",
      mockup: {
        type: "flow",
        steps: [{ label: "Request" }, { label: "Handler", focus: true }, { label: "DB" }],
        note: "Alur singkat.",
      },
    });
    expect(html).toContain('class="diag-flow"');
    expect(html).toContain('class="arrow"');
    expect(html).toContain('class="node filled"');
    expect(html).toContain("Handler");
    expect(html).toContain('class="catatan');
    expect(html).toContain("Alur singkat.");
    expect(html).not.toContain("FLOW_NODES_INJECT");
    expect(html).not.toContain("NOTE_INJECT");
    expect(html).not.toContain("card-peach");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/ds/schema.test.ts test/ds/render-slide.test.ts`
Expected: FAIL — `flow` not in the union / not rendered.

- [ ] **Step 3: Add the schema member**

In `lib/ds/schema.ts`, add after `mockupBigstat` (before `export const mockupSchema`):

```ts
/** Flow chain — sequential nodes joined by arrows (pipelines/sequences) */
const mockupFlow = z.object({
  type: z.literal("flow"),
  steps: z
    .array(z.object({ label: z.string().max(24), focus: z.boolean().optional() }))
    .min(2)
    .max(5),
  note: z.string().max(90).optional(),
});
```

Add `mockupFlow` to the `z.discriminatedUnion("type", [ … ])` array.

- [ ] **Step 4: Create the flow template**

Create `lib/ds/templates/flow.ts`:

```ts
// Flow-chain mockup — sequential nodes + arrows. Adapted from
// "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" (§ "D2 · Flow chain").
export const flowTemplate = String.raw`<div class="diag-wrap mt-40">
    <div class="diag-flow">FLOW_NODES_INJECT</div>
  </div>
  NOTE_INJECT`;
```

- [ ] **Step 5: Wire render + shared note helper**

In `lib/ds/render-slide.ts`, add the import near the other template imports:

```ts
import { flowTemplate } from "@/lib/ds/templates/flow";
```

Add the shared note helper above the mockup renderers (after the imports/`splitHeadline`):

```ts
/** Optional `.catatan` annotation strip shared by the diagram mockups. */
function renderNote(note?: string): string {
  if (!note) return "";
  return `<div class="catatan mt-40"><div class="catatan-label">Catatan</div><div class="catatan-body">${escapeHtml(note)}</div></div>`;
}
```

Add the flow renderer next to the other `render*Mockup` functions:

```ts
function renderFlowMockup(m: Extract<Mockup, { type: "flow" }>): string {
  const nodes = m.steps
    .map((s) => `<div class="node${s.focus ? " filled" : ""}">${escapeHtml(s.label)}</div>`)
    .join('<div class="arrow">→</div>');
  return flowTemplate
    .replace("FLOW_NODES_INJECT", () => nodes)
    .replace("NOTE_INJECT", () => renderNote(m.note));
}
```

Add the case to `renderMockup`'s switch (before the `case "card":` line):

```ts
    case "flow":
      return renderFlowMockup(m);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- test/ds/schema.test.ts test/ds/render-slide.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/ds/schema.ts lib/ds/templates/flow.ts lib/ds/render-slide.ts test/ds/schema.test.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): flow-chain mockup"
```

---

### Task 3: `concept` mockup (concept-hub)

**Files:**
- Create: `lib/ds/templates/concept.ts`
- Modify: `lib/ds/schema.ts`, `lib/ds/render-slide.ts`
- Test: `test/ds/schema.test.ts`, `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `diagLines`, `renderNote`, `escapeHtml`.
- Produces: mockup `{ type:"concept", parent, children:[string](3–4), note?}`; `conceptTemplate`.

- [ ] **Step 1: Write the failing tests**

Add to `test/ds/schema.test.ts` (new describe):

```ts
describe("concept mockup", () => {
  it("parses a concept with 4 children", () => {
    const m = mockupSchema.parse({
      type: "concept", parent: "HTTP",
      children: ["GET", "POST", "PUT", "DELETE"],
    });
    expect(m.type).toBe("concept");
  });
  it("rejects a concept with 2 children (min 3)", () => {
    expect(() => mockupSchema.parse({ type: "concept", parent: "x", children: ["a", "b"] })).toThrow();
  });
});
```

Add to `test/ds/render-slide.test.ts` (inside `describe("renderSlide", …)`):

```ts
  it("renders a concept mockup with parent + child nodes", () => {
    const html = renderSlide({
      role: "point", counter: "03/07", eyebrow: "TERM", headline: "HTTP", body: "desc",
      mockup: { type: "concept", parent: "HTTP", children: ["GET", "POST", "PUT", "DELETE"], note: "4 verb inti." },
    });
    expect(html).toContain('class="diag-hub"');
    expect(html).toContain('class="node filled big"');
    expect(html).toContain('class="children"');
    expect(html).toContain('class="lines"');
    expect(html).toContain("DELETE");
    expect(html).toContain('class="catatan');
    expect(html).not.toContain("CONCEPT_CHILDREN_INJECT");
    expect(html).not.toContain("CONCEPT_LINES_INJECT");
    expect(html).not.toContain("CONCEPT_PARENT_INJECT");
    expect(html).not.toContain("card-peach");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/ds/schema.test.ts test/ds/render-slide.test.ts`
Expected: FAIL — `concept` not handled.

- [ ] **Step 3: Add the schema member**

In `lib/ds/schema.ts`, add after `mockupFlow`:

```ts
/** Concept hub — parent node → 3–4 child pills (term glossaries) */
const mockupConcept = z.object({
  type: z.literal("concept"),
  parent: z.string().max(20),
  children: z.array(z.string().max(18)).min(3).max(4),
  note: z.string().max(90).optional(),
});
```

Add `mockupConcept` to the `discriminatedUnion` array.

- [ ] **Step 4: Create the concept template**

Create `lib/ds/templates/concept.ts`:

```ts
// Concept-hub mockup — parent → child pills. Adapted from
// "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" (§ "D1 · Concept hub").
export const conceptTemplate = String.raw`<div class="diag-wrap mt-40">
    <div class="diag-hub">
      <div class="center"><div class="node filled big">CONCEPT_PARENT_INJECT</div></div>
      CONCEPT_LINES_INJECT
      <div class="children">CONCEPT_CHILDREN_INJECT</div>
    </div>
  </div>
  NOTE_INJECT`;
```

- [ ] **Step 5: Wire render + switch**

In `lib/ds/render-slide.ts`, add the imports (`diagLines` is first used here):

```ts
import { conceptTemplate } from "@/lib/ds/templates/concept";
import { diagLines } from "@/lib/ds/hub-lines";
```

Add the renderer:

```ts
function renderConceptMockup(m: Extract<Mockup, { type: "concept" }>): string {
  const children = m.children.map((c) => `<div class="node">${escapeHtml(c)}</div>`).join("");
  const lines = diagLines(m.children.length, { viewH: 380, midY: 200, endY: 300 });
  return conceptTemplate
    .replace("CONCEPT_PARENT_INJECT", () => escapeHtml(m.parent))
    .replace("CONCEPT_LINES_INJECT", () => lines)
    .replace("CONCEPT_CHILDREN_INJECT", () => children)
    .replace("NOTE_INJECT", () => renderNote(m.note));
}
```

Add the switch case (before `case "card":`):

```ts
    case "concept":
      return renderConceptMockup(m);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- test/ds/schema.test.ts test/ds/render-slide.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/ds/schema.ts lib/ds/templates/concept.ts lib/ds/render-slide.ts test/ds/schema.test.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): concept-hub mockup"
```

---

### Task 4: `hub` mockup (icon-hub, uses allowlist icons)

**Files:**
- Create: `lib/ds/templates/hub.ts`
- Modify: `lib/ds/schema.ts`, `lib/ds/render-slide.ts`
- Test: `test/ds/schema.test.ts`, `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `diagLines`, `renderNote`, `renderIcon` (already imported), `iconField`, `escapeHtml`.
- Produces: mockup `{ type:"hub", center, tools:[{icon,label}](3–4), note?}`; `hubTemplate`.

- [ ] **Step 1: Write the failing tests**

Add to `test/ds/schema.test.ts` (new describe):

```ts
describe("hub mockup", () => {
  it("parses a hub and coerces tool icons to the allowlist", () => {
    const m = mockupSchema.parse({
      type: "hub", center: "API",
      tools: [
        { icon: "lucide:database", label: "DB" },
        { icon: "made-up-xyz", label: "Cache" },
        { icon: "cloud", label: "CDN" },
      ],
    });
    expect(m.type).toBe("hub");
    if (m.type === "hub") {
      expect(m.tools[0].icon).toBe("database");
      expect(m.tools[1].icon).toBe("sparkles");
    }
  });
  it("rejects a hub with 5 tools (max 4)", () => {
    const tools = Array.from({ length: 5 }, () => ({ icon: "box", label: "x" }));
    expect(() => mockupSchema.parse({ type: "hub", center: "c", tools })).toThrow();
  });
});
```

Add to `test/ds/render-slide.test.ts` (inside `describe("renderSlide", …)`):

```ts
  it("renders a hub mockup with inline-svg tool glyphs", () => {
    const html = renderSlide({
      role: "point", counter: "04/07", eyebrow: "HUB", headline: "API", body: "desc",
      mockup: {
        type: "hub", center: "API",
        tools: [
          { icon: "database", label: "DB" },
          { icon: "cloud", label: "CDN" },
          { icon: "server", label: "Node" },
        ],
      },
    });
    expect(html).toContain('class="diag-icon-hub"');
    expect(html).toContain('class="glyph"');
    expect(html).toContain("<svg");
    expect(html).toContain('class="lines"');
    expect(html).toContain("CDN");
    expect(html).not.toContain("iconify-icon");
    expect(html).not.toContain("HUB_TOOLS_INJECT");
    expect(html).not.toContain("HUB_LINES_INJECT");
    expect(html).not.toContain("HUB_CENTER_INJECT");
    expect(html).not.toContain("card-peach");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/ds/schema.test.ts test/ds/render-slide.test.ts`
Expected: FAIL — `hub` not handled.

- [ ] **Step 3: Add the schema member**

In `lib/ds/schema.ts`, add after `mockupConcept` (reuses the existing `iconField`):

```ts
/** Icon hub — center node → 3–4 tool icons via dashed arrows */
const mockupHub = z.object({
  type: z.literal("hub"),
  center: z.string().max(20),
  tools: z
    .array(z.object({ icon: iconField, label: z.string().max(16) }))
    .min(3)
    .max(4),
  note: z.string().max(90).optional(),
});
```

Add `mockupHub` to the `discriminatedUnion` array.

- [ ] **Step 4: Create the hub template**

Create `lib/ds/templates/hub.ts`:

```ts
// Icon-hub mockup — center → tool glyphs. Adapted from
// "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" (§ "D5 · Icon hub").
// Tool glyphs are injected as inline allowlist SVGs; `.glyph svg` CSS sizes/colors them.
export const hubTemplate = String.raw`<div class="diag-wrap mt-40">
    <div class="diag-icon-hub">
      <div class="center"><div class="node filled big">HUB_CENTER_INJECT</div></div>
      HUB_LINES_INJECT
      <div class="tools">HUB_TOOLS_INJECT</div>
    </div>
  </div>
  NOTE_INJECT`;
```

- [ ] **Step 5: Wire render + switch**

In `lib/ds/render-slide.ts`, add the import:

```ts
import { hubTemplate } from "@/lib/ds/templates/hub";
```

Add the renderer (`renderIcon` is already imported from `@/lib/ds/icons`):

```ts
function renderHubMockup(m: Extract<Mockup, { type: "hub" }>): string {
  const tools = m.tools
    .map(
      (t) =>
        `<div class="tool"><div class="glyph">${renderIcon(t.icon)}</div><div class="label">${escapeHtml(t.label)}</div></div>`
    )
    .join("");
  const lines = diagLines(m.tools.length, { viewH: 400, midY: 220, endY: 320 });
  return hubTemplate
    .replace("HUB_CENTER_INJECT", () => escapeHtml(m.center))
    .replace("HUB_LINES_INJECT", () => lines)
    .replace("HUB_TOOLS_INJECT", () => tools)
    .replace("NOTE_INJECT", () => renderNote(m.note));
}
```

Add the switch case (before `case "card":`):

```ts
    case "hub":
      return renderHubMockup(m);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- test/ds/schema.test.ts test/ds/render-slide.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/ds/schema.ts lib/ds/templates/hub.ts lib/ds/render-slide.ts test/ds/schema.test.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): icon-hub mockup with allowlist glyphs"
```

---

### Task 5: `checklist` mockup

**Files:**
- Create: `lib/ds/templates/checklist.ts`
- Modify: `lib/ds/schema.ts`, `lib/ds/render-slide.ts`
- Test: `test/ds/schema.test.ts`, `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `renderNote`, `escapeHtml`.
- Produces: mockup `{ type:"checklist", items:[string](3–6), note?}`; `checklistTemplate`.

- [ ] **Step 1: Write the failing tests**

Add to `test/ds/schema.test.ts` (new describe):

```ts
describe("checklist mockup", () => {
  it("parses a checklist with items", () => {
    const m = mockupSchema.parse({ type: "checklist", items: ["A", "B", "C"] });
    expect(m.type).toBe("checklist");
  });
  it("rejects a checklist with 7 items (max 6)", () => {
    const items = Array.from({ length: 7 }, (_, i) => `item ${i}`);
    expect(() => mockupSchema.parse({ type: "checklist", items })).toThrow();
  });
});
```

Add to `test/ds/render-slide.test.ts` (inside `describe("renderSlide", …)`):

```ts
  it("renders a checklist mockup with ticks", () => {
    const html = renderSlide({
      role: "point", counter: "07/07", eyebrow: "RECAP", headline: "Ringkasan", body: "desc",
      mockup: { type: "checklist", items: ["Idempotency", "Retry-safe", "Key unik"], note: "Simpan ya." },
    });
    expect(html).toContain('class="checklist');
    expect(html).toContain('class="tick"');
    expect(html).toContain("Retry-safe");
    expect(html).toContain('class="catatan');
    expect(html).not.toContain("CHECKLIST_ITEMS_INJECT");
    expect(html).not.toContain("card-peach");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/ds/schema.test.ts test/ds/render-slide.test.ts`
Expected: FAIL — `checklist` not handled.

- [ ] **Step 3: Add the schema member**

In `lib/ds/schema.ts`, add after `mockupHub`:

```ts
/** Recap checklist — 3–6 ticked items */
const mockupChecklist = z.object({
  type: z.literal("checklist"),
  items: z.array(z.string().max(48)).min(3).max(6),
  note: z.string().max(90).optional(),
});
```

Add `mockupChecklist` to the `discriminatedUnion` array.

- [ ] **Step 4: Create the checklist template**

Create `lib/ds/templates/checklist.ts`:

```ts
// Recap-checklist mockup — ticked list. Adapted from
// "Vour Dev Design System/bundle/TEMPLATE-editorial-v3.html" (§ "D9 · Recap checklist").
export const checklistTemplate = String.raw`<ul class="checklist mt-40">CHECKLIST_ITEMS_INJECT</ul>
  NOTE_INJECT`;
```

- [ ] **Step 5: Wire render + switch**

In `lib/ds/render-slide.ts`, add the import:

```ts
import { checklistTemplate } from "@/lib/ds/templates/checklist";
```

Add the renderer:

```ts
function renderChecklistMockup(m: Extract<Mockup, { type: "checklist" }>): string {
  const items = m.items
    .map((i) => `<li><span class="tick">✓</span> ${escapeHtml(i)}</li>`)
    .join("");
  return checklistTemplate
    .replace("CHECKLIST_ITEMS_INJECT", () => items)
    .replace("NOTE_INJECT", () => renderNote(m.note));
}
```

Add the switch case (before `case "card":`):

```ts
    case "checklist":
      return renderChecklistMockup(m);
```

- [ ] **Step 6: Run the full DS suite + typecheck**

Run: `npm test -- test/ds`
Expected: PASS (all `test/ds/*`).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/ds/schema.ts lib/ds/templates/checklist.ts lib/ds/render-slide.ts test/ds/schema.test.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): recap-checklist mockup"
```

---

### Task 6: Sample deck showcase + context-driven prompt rules

**Files:**
- Modify: `lib/ds/sample.ts`
- Modify: `lib/ai/prompts.ts`
- Test: `test/ds/sample.test.ts`, `test/ai/prompts.test.ts`

**Interfaces:**
- Consumes: all four new mockups (data only) and their doc strings.

- [ ] **Step 1: Update the sample tests**

In `test/ds/sample.test.ts`, change the section-count assertion from 7 to 8:

Replace
```ts
  it("assembles to a full document with 7 sections", () => {
    const html = assembleCarousel(samplePlan);
    expect((html.match(/<section\s/g) ?? []).length).toBe(7);
  });
```
with
```ts
  it("assembles to a full document with 8 sections", () => {
    const html = assembleCarousel(samplePlan);
    expect((html.match(/<section\s/g) ?? []).length).toBe(8);
  });
```

Add to the `describe("samplePlan variety", …)` block:

```ts
  it("uses the new diagram mockups (flow/hub/concept/checklist)", () => {
    const types = new Set(
      samplePlan.slides
        .filter((s) => s.role === "point")
        .map((s) => (s as { mockup?: { type: string } }).mockup?.type)
    );
    for (const t of ["flow", "hub", "concept", "checklist"]) {
      expect(types.has(t), t).toBe(true);
    }
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/ds/sample.test.ts`
Expected: FAIL — only 7 sections; new types absent.

- [ ] **Step 3: Rewrite the sample deck**

Replace the `slides` array in `lib/ds/sample.ts` with an 8-slide deck that keeps ≤1 terminal and exercises all four new types (all icons in the allowlist, copy within budget):

```ts
  slides: [
    {
      role: "cover",
      eyebrow: "BACKEND 101",
      headline: "Idempotency itu wajib",
      accentWord: "Idempotency",
      lede: "Biar retry nggak bikin data dobel — konsep yang wajib lo ngerti, bukan cuma hafal.",
    },
    {
      role: "point",
      counter: "02 / 08",
      eyebrow: "TERM",
      headline: "Pecah istilahnya",
      accentWord: "istilahnya",
      body: "Idempotency dibentuk dari beberapa ide inti yang saling nyambung.",
      mockup: {
        type: "concept",
        parent: "Idempotency",
        children: ["Key", "Retry", "Dedupe", "State"],
        note: "Idempotency = request sama, hasil satu.",
      },
    },
    {
      role: "point",
      counter: "03 / 08",
      eyebrow: "ALUR",
      headline: "Jalannya request",
      accentWord: "request",
      body: "Retry masuk ke jalur yang sama; key bikin server kenal duplikat.",
      mockup: {
        type: "flow",
        steps: [
          { label: "Client" },
          { label: "API", focus: true },
          { label: "Dedupe" },
          { label: "DB" },
        ],
        note: "Dedupe nyaring key yang sama.",
      },
    },
    {
      role: "point",
      counter: "04 / 08",
      eyebrow: "CONTOH",
      headline: "Pakai Idempotency-Key",
      accentWord: "Idempotency-Key",
      body: "Kirim key unik per aksi; server nolak duplikat dengan key yang sama.",
      mockup: {
        type: "terminal",
        filename: "charge.ts",
        lines: [
          { text: "// key unik per aksi", style: "cmt" },
          { text: "await pay(order, {", style: "plain" },
          { text: "  idempotencyKey: uuid()", style: "key" },
          { text: "})", style: "plain" },
        ],
      },
    },
    {
      role: "point",
      counter: "05 / 08",
      eyebrow: "EKOSISTEM",
      headline: "Simpan state di mana",
      accentWord: "state",
      body: "Server nyimpen key yang sudah diproses di salah satu store ini.",
      mockup: {
        type: "hub",
        center: "Key store",
        tools: [
          { icon: "database", label: "Postgres" },
          { icon: "zap", label: "Redis" },
          { icon: "cloud", label: "DynamoDB" },
        ],
        note: "Pilih yang cepat & tahan lama.",
      },
    },
    {
      role: "point",
      counter: "06 / 08",
      eyebrow: "SALAH VS BENAR",
      headline: "Jangan retry buta",
      accentWord: "buta",
      body: "Retry tanpa key bikin dobel; dengan key aman diulang.",
      mockup: {
        type: "comparison",
        loserLabel: "Tanpa key",
        loserLine: "2× charge ke kartu user",
        winnerLabel: "Dengan key",
        winnerLine: "Charge kedua di-skip server",
        winnerRationale: "Server ingat key yang sudah diproses.",
      },
    },
    {
      role: "point",
      counter: "07 / 08",
      eyebrow: "RECAP",
      headline: "Yang lo dapat",
      accentWord: "dapat",
      body: "Ringkasan biar gampang diinget.",
      mockup: {
        type: "checklist",
        items: [
          "Retry itu normal",
          "Idempotency-Key per aksi",
          "Server dedupe by key",
          "Retry jadi aman",
        ],
        note: "Simpan biar nggak lupa.",
      },
    },
    {
      role: "outro",
      eyebrow: "KESIMPULAN",
      headline: "Bikin retry aman",
      accentWord: "aman",
      body: "Idempotency = request sama, hasil tetap satu.",
      cta: {
        strong: "Simpan & bagikan",
        sub: "Backend & dev-education tiap minggu di @vourdev.",
      },
    },
  ],
```

- [ ] **Step 4: Run the sample tests**

Run: `npm test -- test/ds/sample.test.ts`
Expected: PASS.

- [ ] **Step 5: Document the new mockups in the plan prompt**

In `lib/ai/prompts.ts`, inside `planSystem`, add four entries after mockup type 6 (bigstat), before the `ICON RULES:` block:

```
7. { type: "flow", steps: [{ label: "...", focus?: true }], note?: "..." }
   → Sequential nodes with arrows (2–5 steps, one optional "focus"). Use for pipelines / ordered sequences (request → handler → db).

8. { type: "hub", center: "...", tools: [{ icon: "<allowlisted-slug>", label: "..." }], note?: "..." }
   → Center node wired to 3–4 tools. Use for "X connects to A, B, C, D" (services, integrations).

9. { type: "concept", parent: "...", children: ["...", "..."], note?: "..." }
   → Parent term broken into 3–4 sub-concepts. Use for glossaries / foundational concept breakdowns.

10. { type: "checklist", items: ["...", "..."], note?: "..." }
   → 3–6 ticked recap items. Use for "what you learned" / summary slides.
```

- [ ] **Step 6: Replace the variety rule with a context rule**

In `lib/ai/prompts.ts` `planSystem`, replace budget rule 5 (the "VARY mockup types — do NOT use the same type on 3+ consecutive slides…" line) with:

```
5. CONTEXT-DRIVEN MOCKUP CHOICE: pick the mockup that best fits the slide's content —
   flow for pipelines/sequences, hub for one thing wiring to several tools, concept for a
   term's sub-concepts, comparison for bad-vs-good, steps for how-to, bigstat for a metric,
   callout for a warning, card for a general point, checklist for a recap. Use "terminal"
   ONLY when the slide shows real code/CLI/config, and AT MOST ONCE per deck. Every deck
   MUST use ≥3 distinct mockup types and must not repeat a type on consecutive slides.
```

Then update the `VARIETY EXAMPLE` block (added in the previous work) so its point rows read:

```
- point → concept (parent + 3–4 children)
- point → flow (3–4 steps, one focus)
- point → hub (center + 3–4 tool icons)
- point → terminal (only if a real code scene — max 1)
- point → comparison (bad vs good)
- point → checklist (recap)
```

- [ ] **Step 7: Update the prompt test**

In `test/ai/prompts.test.ts`, extend the "documents all 6 mockup types" test to cover the new ones — add after the existing `expect(planSystem).toContain('"card"');`:

```ts
    expect(planSystem).toContain('"flow"');
    expect(planSystem).toContain('"hub"');
    expect(planSystem).toContain('"concept"');
    expect(planSystem).toContain('"checklist"');
```

Add a new test in the `describe("planSystem", …)` block:

```ts
  it("makes mockup choice context-driven and caps terminal at once per deck", () => {
    expect(planSystem).toMatch(/CONTEXT-DRIVEN MOCKUP CHOICE/);
    expect(planSystem).toMatch(/ONLY when the slide shows real code/);
    expect(planSystem).toMatch(/AT MOST ONCE per deck/);
  });
```

- [ ] **Step 8: Run the whole suite + typecheck + lint**

Run: `npm test`
Expected: PASS (all files).

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint lib/ds/hub-lines.ts lib/ds/render-slide.ts lib/ds/schema.ts lib/ds/sample.ts lib/ai/prompts.ts lib/ds/templates/flow.ts lib/ds/templates/hub.ts lib/ds/templates/concept.ts lib/ds/templates/checklist.ts`
Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add lib/ds/sample.ts lib/ai/prompts.ts test/ds/sample.test.ts test/ai/prompts.test.ts
git commit -m "feat(ai): showcase deck + context-driven mockup selection"
```

---

## Final Verification

- [ ] `npm test` — all green.
- [ ] `npx tsc --noEmit` — no type errors.
- [ ] `npx eslint <changed files>` — clean.
- [ ] Manual: `npm run dev` → `/create` → generate a deck → confirm flow/hub/concept/checklist appear, terminal ≤1 and only on a genuine code slide, and every diagram icon renders in preview AND exported PNG.

## Self-Review Notes (author)

- **Spec coverage:** 4 mockups → Tasks 2–5; connector helper → Task 1; context-driven prompt + terminal cap → Task 6; sample showcase → Task 6; tests folded into each task. All spec sections mapped.
- **Type consistency:** `diagLines(count, {viewH,midY,endY})`, `renderNote(note?)`, `iconField`, `renderIcon`, and the sentinels (`FLOW_NODES_INJECT`, `CONCEPT_PARENT/LINES/CHILDREN_INJECT`, `HUB_CENTER/LINES/TOOLS_INJECT`, `CHECKLIST_ITEMS_INJECT`, `NOTE_INJECT`) are used identically across tasks.
- **Green-between-tasks:** every task adds a schema member AND its `renderMockup` switch case together, so exhaustiveness holds; hub/concept depend on `diagLines` from Task 1; `renderNote` is introduced in Task 2 and reused.
- **Deviation:** checklist is a fragment (not a standalone recap slide role), per the spec's "one wiring pattern" decision.
