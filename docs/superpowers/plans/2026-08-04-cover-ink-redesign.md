# Cover Ink Redesign + Trigger-Angle Cover System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make generated cover slides render on the Ink (dark) surface with an Ember-bright accent and one strong visual anchor, add three new LLM-fillable cover anchors (badge, nocgrid, door), and encode a trigger-angle framework in the prompt so covers are never flat.

**Architecture:** Covers already have a `hook` slot (a discriminated union: `device | image | custom`). We extend that union with three new `kind`s and make the cover renderer always emit the Ink surface class. Each new anchor follows the established 6-touchpoint recipe (schema → template → render-slide → carousel-css-extra → prompts → repair). Slide bodies stay on Paper — `DESIGN.md` locks "two surfaces only, Paper is default."

**Tech Stack:** TypeScript, Zod (schema + `.safeParse` repair), string-template HTML render (custom `fillTemplate`/`injectSentinels`), Vitest, Playwright (visual verify).

## Global Constraints

- **Canvas:** every slide is exactly `1080 × 1350`. Headlines live in the upper-middle; keep clear of the bottom ~120px (platform caption zone).
- **Two surfaces only:** Paper (`#FBF6EF`, default) + Ink (`#14110E`). Covers = Ink. Bodies = Paper. Never a third theme.
- **One accent:** Ember `#EE4B1A` on Paper, Ember-bright `#FF6A3D` on Ink. Never on body paragraphs.
- **`carousel-css.ts` is DO-NOT-EDIT** (verbatim bundle). All new CSS goes in `carousel-css-extra.ts`, with CSS vars translated to hardcoded hex.
- **`.badge` is already taken** by the step-number badge in `carousel-css.ts`. New badge anchor MUST use `.cover-badge`.
- **`bundle/` is codegen** — never hand-edit; not touched by this plan.
- **Escaping:** all user/LLM text passes through `escapeHtml`. Raw fragments are injected with the **function-replacer** form `.replace(SENTINEL, () => value)` so `$`-sequences (`$$`, `$&`, `` $` ``) are never interpreted.
- **Verify gates (run per task where noted):** `npx tsc --noEmit` must be exit 0. `npx vitest run test/ds/` must show **no NEW failures** beyond the 4 documented pre-existing ones (hub-lines, icons, callout, concept — stale v1.0-port assertions).
- **Voice:** no em-dash `—` in slide copy (repair strips it deck-wide via `stripDashesDeep`).

---

## File Structure

**Created:**
- `lib/ds/templates/cover-badge.ts` — badge anchor markup + sentinels
- `lib/ds/templates/cover-nocgrid.ts` — NOC status-grid markup + sentinels
- `lib/ds/templates/cover-door.ts` — Norman-door markup + sentinels

**Modified:**
- `lib/ds/schema.ts` — 3 new `coverHook*` objects added to `coverHookSchema`
- `lib/ds/render-slide.ts` — cover always Ink; 3 new hook renderers; wire into hook branch
- `lib/ds/templates/cover.ts` — `{{coverSurface}}` slot on the hero `<section>`
- `lib/ds/templates/cover-compact.ts` — `{{coverSurface}}` slot on the compact `<section>`
- `lib/ds/carousel-css-extra.ts` — `section.cover-ink` + `.cover-badge` + `.cover-noc` + `.cover-door`
- `lib/ai/prompts.ts` — trigger-angle cover framework + new hook docs
- `lib/ds/repair.ts` — drop a malformed cover hook (fallback to hero cover) instead of throwing
- `test/ds/render-slide.test.ts` — cover-Ink + 3-anchor render tests
- `test/ds/repair.test.ts` — malformed-cover-hook safety test

---

## Task 1: Cover always renders on the Ink surface

**Files:**
- Modify: `lib/ds/templates/cover.ts`
- Modify: `lib/ds/templates/cover-compact.ts`
- Modify: `lib/ds/render-slide.ts` (the `case "cover"` block, ~line 368–391)
- Modify: `lib/ds/carousel-css-extra.ts`
- Test: `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `coverTemplate`, `coverCompactTemplate` (string templates with `{{slot}}`); `fillTemplate(tpl, vars)`; existing `section.ink` CSS (from TASK 2, already in `carousel-css-extra.ts`).
- Produces: cover HTML whose root `<section>` carries `class="... ink cover-ink"`. No signature changes.

- [ ] **Step 1: Write the failing test**

Add to `test/ds/render-slide.test.ts` (check the top of the file first; it already imports `renderSlide` and `Slide`):

```ts
describe("cover Ink surface", () => {
  it("renders a hookless cover on the Ink surface", () => {
    const slide: Slide = {
      role: "cover",
      eyebrow: "HOT TAKE",
      headline: "DevOps Bukan Jabatan",
      accentWord: "Bukan",
    };
    const html = renderSlide(slide);
    expect(html).toContain("cover-ink");
    expect(html).toContain("ink"); // section.ink overrides apply
  });

  it("renders a cover WITH a hook on the Ink surface", () => {
    const slide: Slide = {
      role: "cover",
      eyebrow: "CODE REVIEW",
      headline: "Kebiasaan yang Bikin Kodemu Dibenci",
      accentWord: "Dibenci",
      hook: { kind: "device", chrome: "terminal", lines: [{ text: "npm run lint", style: "plain" }] },
    };
    const html = renderSlide(slide);
    expect(html).toContain("cover-ink");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/ds/render-slide.test.ts -t "cover Ink surface"`
Expected: FAIL — output has no `cover-ink` (covers currently render on Paper with no such class).

- [ ] **Step 3: Add the `{{coverSurface}}` slot to both cover templates**

In `lib/ds/templates/cover.ts`, change the opening tag:

```
export const coverTemplate = String.raw`<section data-screen-label="01 · Cover" class="cover-editorial {{coverSurface}}">
```

In `lib/ds/templates/cover-compact.ts`, change the opening tag:

```
export const coverCompactTemplate = String.raw`<section data-screen-label="01 · Cover" class="{{coverSurface}}">
```

- [ ] **Step 4: Fill the slot in the renderer**

In `lib/ds/render-slide.ts`, `case "cover"`, pass `coverSurface: "ink cover-ink"` in BOTH `fillTemplate` calls (the hookless `coverTemplate` call and the `coverCompactTemplate` call). Example for the hookless branch:

```ts
if (!slide.hook) {
  return fillTemplate(coverTemplate, {
    brand,
    coverSurface: "ink cover-ink",
    eyebrow: slide.eyebrow,
    ...splitHeadline(slide.headline, slide.accentWord),
    lede: slide.lede ?? "",
  });
}
```

And in the compact branch:

```ts
const base = fillTemplate(coverCompactTemplate, {
  brand,
  coverSurface: "ink cover-ink",
  eyebrow: slide.eyebrow,
  ...splitHeadline(slide.headline, slide.accentWord),
  lede: slide.lede ?? "",
});
```

- [ ] **Step 5: Add the `section.cover-ink` halo CSS**

In `lib/ds/carousel-css-extra.ts`, find the existing `section.ink {` block (from TASK 2) and add immediately AFTER it:

```
  /* ═══ Cover Ink surface — heavier than body Ink: adds the Ember corner halo ═══ */
  section.cover-ink { position: relative; }
  section.cover-ink::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(60% 42% at 100% 0%, rgba(238,75,26,0.16), transparent 60%),
      radial-gradient(50% 40% at 0% 100%, rgba(238,75,26,0.08), transparent 65%);
  }
  section.cover-ink > * { position: relative; z-index: 1; }
```

- [ ] **Step 6: Run the cover-Ink tests + tsc**

Run: `npx vitest run test/ds/render-slide.test.ts -t "cover Ink surface" && npx tsc --noEmit`
Expected: PASS (both new tests), tsc exit 0.

- [ ] **Step 7: Run the full ds suite (no new failures)**

Run: `npx vitest run test/ds/`
Expected: only the 4 documented pre-existing failures; the cover tests pass.

- [ ] **Step 8: Commit**

```bash
git add lib/ds/templates/cover.ts lib/ds/templates/cover-compact.ts lib/ds/render-slide.ts lib/ds/carousel-css-extra.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): render covers on the Ink surface"
```

---

## Task 2: `badge` cover hook (contrarian anchor)

**Files:**
- Modify: `lib/ds/schema.ts`
- Create: `lib/ds/templates/cover-badge.ts`
- Modify: `lib/ds/render-slide.ts`
- Modify: `lib/ds/carousel-css-extra.ts`
- Test: `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `coverHookSchema` (discriminated union on `kind`); `escapeHtml`; `renderIcon(slug, {size,color})`; `CoverHook` type.
- Produces: `renderBadgeHook(h: Extract<CoverHook,{kind:"badge"}>): string`. Schema object `coverHookBadge` with fields `eyebrowLine` (default `"ID · 2026"`), `role`, `sub?`, `struck?`.

- [ ] **Step 1: Add the schema object**

In `lib/ds/schema.ts`, immediately before `export const coverHookSchema = z.discriminatedUnion(...)` (~line 262), add:

```ts
/** Cover anchor — an ID badge (contrarian "X is not a job title" angle) */
const coverHookBadge = z.object({
  kind: z.literal("badge"),
  eyebrowLine: z.string().max(24).default("ID · 2026"),
  role: z.string().max(22),
  sub: z.string().max(40).optional(),
  struck: z.boolean().optional(),
});
```

Then add `coverHookBadge` to the union array:

```ts
export const coverHookSchema = z.discriminatedUnion("kind", [
  coverHookDevice,
  coverHookImage,
  coverHookCustom,
  coverHookBadge,
]);
```

- [ ] **Step 2: Write the failing test**

Add to `test/ds/render-slide.test.ts`:

```ts
describe("cover badge hook", () => {
  it("renders the badge role and strike when struck", () => {
    const slide: Slide = {
      role: "cover",
      eyebrow: "HOT TAKE",
      headline: "DevOps Bukan Jabatan",
      accentWord: "Bukan",
      hook: { kind: "badge", role: "DevOps Engineer", sub: "// satu job title", struck: true },
    };
    const html = renderSlide(slide);
    expect(html).toContain("cover-badge");
    expect(html).toContain("DevOps Engineer");
    expect(html).toContain("cover-strike");
    expect(html).toContain("cover-ink"); // still Ink
  });

  it("omits the strike when not struck and applies the eyebrowLine default", () => {
    const slide: Slide = {
      role: "cover", eyebrow: "X", headline: "Y Bukan Z", accentWord: "Bukan",
      hook: { kind: "badge", role: "Sysadmin" },
    };
    const html = renderSlide(slide);
    expect(html).not.toContain("cover-strike");
    expect(html).toContain("ID · 2026"); // default eyebrowLine
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run test/ds/render-slide.test.ts -t "cover badge hook"`
Expected: FAIL — `cover-badge` not in output (renderer + template don't exist yet).

- [ ] **Step 4: Create the template**

Create `lib/ds/templates/cover-badge.ts`:

```ts
// Cover anchor — ID badge, optionally struck through with an Ember bar.
// Ported from the approved cover-slides preview (DevOps cover). Sentinels are
// filled by renderBadgeHook (all user text escaped there).
export const coverBadgeTemplate = String.raw`<div class="anchor-wrap">
  <div class="cover-badge">
    <div class="hole"></div>
    <div class="brow">BADGE_BROW_INJECT</div>
    <div class="role">BADGE_ROLE_INJECT</div>
    BADGE_SUB_INJECT
    BADGE_STRIKE_INJECT
  </div>
</div>`;
```

- [ ] **Step 5: Write the renderer**

In `lib/ds/render-slide.ts`, add (near the other hook renderers, after `renderImageHook`). Import `coverBadgeTemplate` at the top with the other template imports.

```ts
function renderBadgeHook(h: Extract<CoverHook, { kind: "badge" }>): string {
  const gitIcon = renderIcon("git-branch", { size: 24, color: "#FF6A3D" });
  const sub = h.sub ? `<div class="sub">${escapeHtml(h.sub)}</div>` : "";
  const strike = h.struck ? `<div class="cover-strike"></div>` : "";
  return coverBadgeTemplate
    .replace("BADGE_BROW_INJECT", () => `${gitIcon}${escapeHtml(h.eyebrowLine)}`)
    .replace("BADGE_ROLE_INJECT", () => escapeHtml(h.role))
    .replace("BADGE_SUB_INJECT", () => sub)
    .replace("BADGE_STRIKE_INJECT", () => strike);
}
```

- [ ] **Step 6: Wire it into the cover hook branch**

In `lib/ds/render-slide.ts`, the cover branch builds `fragment` from `h.kind`. Add a case:

```ts
if (h.kind === "device") fragment = renderDeviceHook(h);
else if (h.kind === "custom") fragment = sanitizeHookHtml(h.html);
else if (h.kind === "image") fragment = renderImageHook(h);
else if (h.kind === "badge") fragment = renderBadgeHook(h);
```

- [ ] **Step 7: Add the badge CSS**

In `lib/ds/carousel-css-extra.ts`, after the `section.cover-ink` block from Task 1, add:

```
  /* Cover anchor wrapper — centers the single visual anchor in the free space */
  .anchor-wrap { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }

  /* Cover anchor — ID badge (NOT .badge; that is the step-number badge) */
  .cover-badge { position: relative; width: 560px; padding: 48px 44px 44px; border-radius: 26px;
    background: #1F1A15; border: 1.5px solid #2B241D; transform: rotate(-4deg);
    box-shadow: 0 40px 90px rgba(0,0,0,0.55); }
  .cover-badge .hole { position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
    width: 120px; height: 16px; border-radius: 8px; background: #14110E; border: 1.5px solid #2B241D; }
  .cover-badge .brow { display: flex; align-items: center; gap: 12px; margin-top: 20px;
    font-family: 'JetBrains Mono'; font-size: 22px; color: rgba(247,241,232,0.45); letter-spacing: 0.08em; }
  .cover-badge .role { font-family: 'Sora'; font-weight: 800; font-size: 72px; line-height: 1;
    color: #F7F1E8; margin-top: 22px; }
  .cover-badge .sub { font-family: 'JetBrains Mono'; font-size: 24px; color: rgba(247,241,232,0.45); margin-top: 14px; }
  .cover-badge .cover-strike { position: absolute; left: -10px; right: -10px; top: 56%; height: 12px;
    border-radius: 6px; background: #FF6A3D; transform: rotate(-9deg); box-shadow: 0 8px 30px rgba(255,106,61,0.5); }
```

- [ ] **Step 8: Run tests + tsc**

Run: `npx vitest run test/ds/render-slide.test.ts -t "cover badge hook" && npx tsc --noEmit`
Expected: PASS, tsc exit 0.

- [ ] **Step 9: Commit**

```bash
git add lib/ds/schema.ts lib/ds/templates/cover-badge.ts lib/ds/render-slide.ts lib/ds/carousel-css-extra.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): add badge cover hook (contrarian anchor)"
```

---

## Task 3: `nocgrid` cover hook (urgency/risk anchor)

**Files:**
- Modify: `lib/ds/schema.ts`
- Create: `lib/ds/templates/cover-nocgrid.ts`
- Modify: `lib/ds/render-slide.ts`
- Modify: `lib/ds/carousel-css-extra.ts`
- Test: `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `coverHookSchema`; `escapeHtml`; `renderIcon`.
- Produces: `renderNocGridHook(h): string` emitting exactly `cols*rows` `.node` spans. Schema `coverHookNocGrid` with `cols` (3–6, default 6), `rows` (2–4, default 3), `state` (`"down"|"up"`, default `"down"`), `banner` (default `"100% PACKET LOSS"`).

- [ ] **Step 1: Add the schema object**

In `lib/ds/schema.ts`, before the union (after `coverHookBadge`):

```ts
/** Cover anchor — a NOC status grid, all nodes down (risk) or up (recovered) */
const coverHookNocGrid = z.object({
  kind: z.literal("nocgrid"),
  cols: z.number().int().min(3).max(6).default(6),
  rows: z.number().int().min(2).max(4).default(3),
  state: z.enum(["down", "up"]).default("down"),
  banner: z.string().max(24).default("100% PACKET LOSS"),
});
```

Add `coverHookNocGrid` to the `coverHookSchema` union array.

- [ ] **Step 2: Write the failing test**

Add to `test/ds/render-slide.test.ts`:

```ts
describe("cover nocgrid hook", () => {
  it("emits exactly cols*rows nodes and the banner", () => {
    const slide: Slide = {
      role: "cover", eyebrow: "RISK", headline: "Satu Typo, Semua Mati", accentWord: "Mati",
      hook: { kind: "nocgrid", cols: 6, rows: 3, state: "down", banner: "100% PACKET LOSS" },
    };
    const html = renderSlide(slide);
    const nodeCount = (html.match(/class="node/g) ?? []).length;
    expect(nodeCount).toBe(18); // 6 * 3
    expect(html).toContain("100% PACKET LOSS");
    expect(html).toContain("cover-noc");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run test/ds/render-slide.test.ts -t "cover nocgrid hook"`
Expected: FAIL — `cover-noc` absent.

- [ ] **Step 4: Create the template**

Create `lib/ds/templates/cover-nocgrid.ts`:

```ts
// Cover anchor — NOC status grid. NODES_INJECT is filled with cols*rows nodes,
// GRID_COLS_INJECT with the column count, BANNER_INJECT with the banner row.
export const coverNocGridTemplate = String.raw`<div class="anchor-wrap">
  <div class="cover-noc">
    <div class="grid" style="grid-template-columns:repeat(GRID_COLS_INJECT,1fr)">NODES_INJECT</div>
    <div class="banner">BANNER_INJECT</div>
  </div>
</div>`;
```

- [ ] **Step 5: Write the renderer**

In `lib/ds/render-slide.ts` (import `coverNocGridTemplate`):

```ts
function renderNocGridHook(h: Extract<CoverHook, { kind: "nocgrid" }>): string {
  const down = h.state === "down";
  // NOTE: slugs MUST be in lib/ds/icons.generated allowlist or renderIcon falls back
  // to "sparkles". Verified present: x-circle, check-circle, alert-triangle.
  const nodeIcon = renderIcon(down ? "x-circle" : "check-circle", { size: 34, color: down ? "#FF5A4D" : "#4E9E5C" });
  const nodes = Array.from({ length: h.cols * h.rows })
    .map(() => `<span class="node ${down ? "down" : "up"}">${nodeIcon}</span>`)
    .join("");
  const bannerIcon = renderIcon(down ? "alert-triangle" : "check-circle", { size: 40, color: down ? "#FF5A4D" : "#4E9E5C" });
  return coverNocGridTemplate
    .replace("GRID_COLS_INJECT", () => String(h.cols))
    .replace("NODES_INJECT", () => nodes)
    .replace("BANNER_INJECT", () => `${bannerIcon}${escapeHtml(h.banner)}`);
}
```

- [ ] **Step 6: Wire it into the cover hook branch**

```ts
else if (h.kind === "nocgrid") fragment = renderNocGridHook(h);
```

- [ ] **Step 7: Add the nocgrid CSS**

In `lib/ds/carousel-css-extra.ts`, after the badge block:

```
  /* Cover anchor — NOC status grid */
  .cover-noc { width: 100%; max-width: 840px; }
  .cover-noc .grid { display: grid; gap: 14px; }
  .cover-noc .node { aspect-ratio: 1; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
  .cover-noc .node.down { background: rgba(193,59,26,0.16); border: 1.5px solid #C13B1A; box-shadow: inset 0 0 24px rgba(193,59,26,0.25); }
  .cover-noc .node.up { background: rgba(78,158,92,0.14); border: 1.5px solid #4E9E5C; box-shadow: inset 0 0 24px rgba(78,158,92,0.20); }
  .cover-noc .banner { margin-top: 28px; display: flex; align-items: center; justify-content: center; gap: 14px;
    font-family: 'JetBrains Mono'; font-size: 38px; font-weight: 600; letter-spacing: 0.08em; color: #FF5A4D; }
  .cover-noc .node svg { display: block; }
```

- [ ] **Step 8: Run tests + tsc**

Run: `npx vitest run test/ds/render-slide.test.ts -t "cover nocgrid hook" && npx tsc --noEmit`
Expected: PASS, tsc exit 0.

- [ ] **Step 9: Commit**

```bash
git add lib/ds/schema.ts lib/ds/templates/cover-nocgrid.ts lib/ds/render-slide.ts lib/ds/carousel-css-extra.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): add nocgrid cover hook (urgency/risk anchor)"
```

---

## Task 4: `door` cover hook (misconception anchor)

**Files:**
- Modify: `lib/ds/schema.ts`
- Create: `lib/ds/templates/cover-door.ts`
- Modify: `lib/ds/render-slide.ts`
- Modify: `lib/ds/carousel-css-extra.ts`
- Test: `test/ds/render-slide.test.ts`

**Interfaces:**
- Consumes: `coverHookSchema`; `escapeHtml`; `renderIcon`.
- Produces: `renderDoorHook(h): string`. Schema `coverHookDoor` with `label` (default `"DORONG"`), `pull?` (default true, shows the pull handle the label contradicts).

- [ ] **Step 1: Add the schema object**

In `lib/ds/schema.ts`, before the union (after `coverHookNocGrid`):

```ts
/** Cover anchor — a Norman door: pull handle labeled with a contradicting action */
const coverHookDoor = z.object({
  kind: z.literal("door"),
  label: z.string().max(12).default("DORONG"),
  pull: z.boolean().optional(),
});
```

Add `coverHookDoor` to the `coverHookSchema` union array. The final union is:

```ts
export const coverHookSchema = z.discriminatedUnion("kind", [
  coverHookDevice,
  coverHookImage,
  coverHookCustom,
  coverHookBadge,
  coverHookNocGrid,
  coverHookDoor,
]);
```

- [ ] **Step 2: Write the failing test**

Add to `test/ds/render-slide.test.ts`:

```ts
describe("cover door hook", () => {
  it("renders the label and hand, and shows the pull handle by default", () => {
    const slide: Slide = {
      role: "cover", eyebrow: "MISKONSEPSI", headline: "Cantik Tapi Nggak Kepakai", accentWord: "Nggak Kepakai",
      hook: { kind: "door", label: "DORONG" },
    };
    const html = renderSlide(slide);
    expect(html).toContain("cover-door");
    expect(html).toContain("DORONG");
    expect(html).toContain("handle"); // pull defaults to shown
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run test/ds/render-slide.test.ts -t "cover door hook"`
Expected: FAIL — `cover-door` absent.

- [ ] **Step 4: Create the template**

Create `lib/ds/templates/cover-door.ts`:

```ts
// Cover anchor — Norman door. LABEL_INJECT is the misleading affordance label;
// HANDLE_INJECT is the pull handle (shown unless pull:false); HAND_INJECT the hand glyph.
export const coverDoorTemplate = String.raw`<div class="anchor-wrap">
  <div class="cover-door">
    <div class="label">LABEL_INJECT</div>
    HANDLE_INJECT
    <div class="hand">HAND_INJECT</div>
  </div>
</div>`;
```

- [ ] **Step 5: Write the renderer**

In `lib/ds/render-slide.ts` (import `coverDoorTemplate`):

```ts
function renderDoorHook(h: Extract<CoverHook, { kind: "door" }>): string {
  // "hand"/"pointer" are NOT in the icon allowlist; arrow-right is verified present
  // and reads as the (wrong) push direction the label demands.
  const handIcon = renderIcon("arrow-right", { size: 96, color: "#FF6A3D" });
  const handle = h.pull === false ? "" : `<div class="handle"></div>`;
  return coverDoorTemplate
    .replace("LABEL_INJECT", () => escapeHtml(h.label))
    .replace("HANDLE_INJECT", () => handle)
    .replace("HAND_INJECT", () => handIcon);
}
```

- [ ] **Step 6: Wire it into the cover hook branch**

```ts
else if (h.kind === "door") fragment = renderDoorHook(h);
```

- [ ] **Step 7: Add the door CSS**

In `lib/ds/carousel-css-extra.ts`, after the nocgrid block:

```
  /* Cover anchor — Norman door (pull handle contradicts the label) */
  .cover-door { position: relative; width: 340px; height: 460px; border-radius: 16px;
    background: #1F1A15; border: 1.5px solid #2B241D; display: flex; align-items: center; justify-content: flex-end;
    padding-right: 30px; box-shadow: 0 40px 90px rgba(0,0,0,0.55); }
  .cover-door .label { position: absolute; top: 34px; left: 0; right: 0; text-align: center;
    font-family: 'JetBrains Mono'; font-size: 34px; font-weight: 600; letter-spacing: 0.22em; color: #FF6A3D; }
  .cover-door .handle { width: 26px; height: 200px; border-radius: 13px; background: #F7F1E8; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .cover-door .hand { position: absolute; right: -6px; top: 50%; transform: translateY(-50%); }
  .cover-door .hand svg { display: block; }
```

- [ ] **Step 8: Run tests + tsc**

Run: `npx vitest run test/ds/render-slide.test.ts -t "cover door hook" && npx tsc --noEmit`
Expected: PASS, tsc exit 0.

- [ ] **Step 9: Commit**

```bash
git add lib/ds/schema.ts lib/ds/templates/cover-door.ts lib/ds/render-slide.ts lib/ds/carousel-css-extra.ts test/ds/render-slide.test.ts
git commit -m "feat(ds): add door cover hook (misconception anchor)"
```

---

## Task 5: Repair — drop a malformed cover hook instead of throwing

**Files:**
- Modify: `lib/ds/repair.ts`
- Test: `test/ds/repair.test.ts`

**Interfaces:**
- Consumes: `coverHookSchema` (import into repair.ts), `repairSlidePlan(raw)`.
- Produces: covers with an unparseable `hook` have it deleted (fallback to hero cover) rather than throwing at the final `slidePlanSchema.parse`.

**Context:** Today `repairSlidePlan` only repairs `point` mockups and `outro` cta. A cover with a malformed `hook` reaches the final `slidePlanSchema.parse(raw)` and throws — one bad hook kills the whole deck. New anchors have required fields (`badge.role`, etc.), so this path is now reachable from the LLM. Make it graceful.

- [ ] **Step 1: Write the failing test**

Add to `test/ds/repair.test.ts` (it already imports `repairSlidePlan`):

```ts
describe("repairSlidePlan — cover hooks never crash generation", () => {
  it("drops a malformed badge hook (missing required role) to a hero cover", () => {
    const raw = {
      title: "t", caption: "", hashtags: [],
      slides: [{ role: "cover", eyebrow: "X", headline: "Y Bukan Z", accentWord: "Bukan",
        hook: { kind: "badge" /* role missing → invalid */ } }],
    };
    const plan = repairSlidePlan(raw);
    const cover = plan.slides[0];
    expect(cover.role).toBe("cover");
    if (cover.role !== "cover") return;
    expect(cover.hook).toBeUndefined(); // dropped, not thrown
  });

  it("keeps a valid nocgrid hook untouched", () => {
    const raw = {
      title: "t", caption: "", hashtags: [],
      slides: [{ role: "cover", eyebrow: "R", headline: "Semua Mati", accentWord: "Mati",
        hook: { kind: "nocgrid" } }], // all fields defaulted
    };
    const plan = repairSlidePlan(raw);
    const cover = plan.slides[0];
    if (cover.role !== "cover") throw new Error("unexpected");
    expect(cover.hook?.kind).toBe("nocgrid");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/ds/repair.test.ts -t "cover hooks never crash"`
Expected: FAIL — the first test throws inside `repairSlidePlan` (final parse rejects the invalid hook) instead of returning.

- [ ] **Step 3: Add cover-hook repair**

In `lib/ds/repair.ts`, import the hook schema at the top:

```ts
import { slidePlanSchema, mockupSchema, coverHookSchema, type SlidePlan } from "./schema";
```

Then inside the per-slide loop in `repairSlidePlan`, after the `outro` block (~line 99), add:

```ts
if (s.role === "cover" && s.hook !== undefined) {
  const res = coverHookSchema.safeParse(s.hook);
  if (res.success) s.hook = res.data;
  else delete s.hook; // fall back to the hero cover template
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/ds/repair.test.ts -t "cover hooks never crash"`
Expected: PASS (both).

- [ ] **Step 5: Run the full ds suite**

Run: `npx vitest run test/ds/`
Expected: only the 4 pre-existing failures; all cover + repair tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/ds/repair.ts test/ds/repair.test.ts
git commit -m "feat(ds): drop malformed cover hooks instead of failing the deck"
```

---

## Task 6: Prompt — trigger-angle cover framework + hook docs

**Files:**
- Modify: `lib/ai/prompts.ts`
- Test: none (prompt text; validated by reading + the visual check in Task 7)

**Interfaces:**
- Consumes: the existing plan-prompt string (where `"cover"` and the `hook` shapes are documented — search for `hook:` / `"cover":`).
- Produces: added cover framework text; no code signature change.

**Context:** The prompt currently documents `hook: { kind: "device" | ... }`. We extend it with the three new kinds and prepend a trigger-angle framework so covers are never flat. Keep edits additive.

- [ ] **Step 1: Extend the cover hook documentation**

In `lib/ai/prompts.ts`, find the cover `hook` doc line (it lists `device`/`browser`/`terminal`). Immediately after the existing `hook:` bullet, add the three new hook shapes:

```
    hook (pick ONE visual anchor; cover is always the dark Ink surface):
      device  — { kind:"device", chrome:"browser"|"terminal", label?, lines:[{text,style}] } (code/UI scene)
      badge   — { kind:"badge", role:"DevOps Engineer", sub?:"// one aside", struck?:true } (CONTRARIAN: "X is not a job title")
      nocgrid — { kind:"nocgrid", cols?:6, rows?:3, state:"down", banner?:"100% PACKET LOSS" } (URGENCY/RISK: everything is down)
      door    — { kind:"door", label:"DORONG" } (MISCONCEPTION: pretty but unusable — a pull handle labeled "push")
```

- [ ] **Step 2: Add the trigger-angle framework block**

In `lib/ai/prompts.ts`, near the deck-spine / cover guidance (search for `Deck spine:`), add this block:

```
COVER — the first slide is an AD for the other slides, not slide 0. Make people swipe.
Pick ONE trigger angle, then a headline + ONE visual anchor that fits it:
  MISCONCEPTION  → "you've been wrong about X"      → anchor: door
  URGENCY/RISK   → "not knowing this costs you"     → anchor: nocgrid
  CURIOSITY GAP  → a question you don't answer yet  → anchor: device/image
  NUMBERED       → "N things about X"               → mockup on slide 2: bigstat (giant number)
  CONTRARIAN     → "X is overrated / not a job"     → anchor: badge (struck:true)
  BEFORE/AFTER   → old way vs right way             → mockup on slide 2: comparison
Headline rules: hook word FIRST (a number, or a negative like "Salah"/"Jangan"/"Bukan", or a question word);
≤ 10 words; leave a curiosity gap (don't reveal the solution); stay credible (no misleading clickbait).
Accent exactly ONE keyword with the Ember-bright span. Cover is ALWAYS the Ink surface.
```

- [ ] **Step 3: Sanity-check the prompt still reads coherently**

Run: `npx tsc --noEmit`
Expected: exit 0 (prompt is a template string; this just confirms no accidental backtick/`${}` breakage).

- [ ] **Step 4: Commit**

```bash
git add lib/ai/prompts.ts
git commit -m "feat(ai): trigger-angle cover framework + new cover hook docs"
```

---

## Task 7: Visual verification (all 5 anchors at 1080×1350)

**Files:**
- Temporary scratch scripts (deleted after); no source changes unless a defect is found.

**Interfaces:**
- Consumes: `assembleCarousel(plan)` from `lib/ds/assemble`; Playwright (already a dev dep).
- Produces: 6 screenshots proving contrast + no-overlap; a decision to ship or file follow-up fixes.

- [ ] **Step 1: Write the scratch render script**

Create `scratch-cover.mts`:

```ts
import { assembleCarousel } from "@/lib/ds/assemble";
import type { SlidePlan } from "@/lib/ds/schema";
import { writeFileSync } from "node:fs";

const plan: SlidePlan = {
  title: "cover anchors", caption: "", hashtags: ["fyp","devops","vourdev"],
  slides: [
    { role: "cover", eyebrow: "HOT TAKE", headline: "DevOps Bukan Jabatan Kamu Salah Paham", accentWord: "Bukan",
      hook: { kind: "badge", role: "DevOps Engineer", sub: "// dianggap satu job title", struck: true } },
    { role: "cover", eyebrow: "SATU BARIS FATAL", headline: "Satu Typo di Subnet Kantor Langsung Mati", accentWord: "Mati",
      hook: { kind: "nocgrid", cols: 6, rows: 3, state: "down", banner: "100% PACKET LOSS" } },
    { role: "cover", eyebrow: "MISKONSEPSI", headline: "Desainmu Cantik Tapi Nggak Kepakai", accentWord: "Nggak Kepakai",
      hook: { kind: "door", label: "DORONG" } },
    { role: "cover", eyebrow: "CODE REVIEW", headline: "Kebiasaan yang Bikin Kodemu Dibenci", accentWord: "Dibenci",
      hook: { kind: "device", chrome: "terminal", label: "review.sh", lines: [{ text: "git push --force", style: "plain" }] } },
    { role: "cover", eyebrow: "HOT TAKE", headline: "REST API Itu Overrated", accentWord: "Overrated" },
    { role: "outro", eyebrow: "SELESAI", headline: "Simpan & Bagikan", accentWord: "Bagikan", cta: { strong: "Follow @vourdev" } },
  ],
};
writeFileSync("scratch-out.html", assembleCarousel(plan));
console.log("wrote", plan.slides.length, "slides");
```

- [ ] **Step 2: Write the screenshot script**

Create `scratch-shot.mjs`:

```js
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await p.goto("file://" + process.cwd() + "/scratch-out.html", { waitUntil: "networkidle" });
await p.waitForTimeout(1800);
const s = await p.$$("section");
for (let i = 0; i < s.length; i++) await s[i].screenshot({ path: `scratch-cover-${i + 1}.png` });
console.log("shot", s.length);
await b.close();
```

- [ ] **Step 3: Render + screenshot**

Run: `npx tsx --tsconfig tsconfig.json scratch-cover.mts && node scratch-shot.mjs`
Expected: `scratch-out.html` written; 6 PNGs produced.

- [ ] **Step 4: Inspect each cover**

Open `scratch-cover-1.png` … `-5.png`. Verify for EACH: Ink dark background with Ember halo; eyebrow + accent word in Ember-bright; headline in the upper-middle (clear of bottom ~120px); the anchor centered, high-contrast, not overlapping the headline or the "Geser →" footer. Confirm no sentinel text (`_INJECT`) leaked.

- [ ] **Step 5: Clean up scratch files**

```bash
rm -f scratch-cover.mts scratch-shot.mjs scratch-out.html scratch-cover-*.png
```

- [ ] **Step 6: Final full-suite gate + commit any fixes**

Run: `npx tsc --noEmit && npx vitest run test/ds/`
Expected: tsc exit 0; only the 4 pre-existing failures. If a visual defect required a CSS/render fix, commit it:

```bash
git add -A
git commit -m "fix(ds): cover anchor visual adjustments from 1080x1350 review"
```

---

## Self-Review Notes

- **Spec coverage:** §3A Ink cover → Task 1. §3B/C 3 new hooks → Tasks 2–4; reuse of bigstat/comparison → documented in the Task 6 prompt (numbered→bigstat on slide 2, before/after→comparison), no code needed. §3D trigger-angle → Task 6. §8 repair fallback → Task 5. §9 testing → per-task tests + Task 7 visual. §6 CSS names use `.cover-*` (no `.badge` collision).
- **Escaping:** every renderer uses `escapeHtml` on user text and the function-replacer form for fragment injection (matches existing `renderFolderTreeMockup`/`renderCommandPaletteMockup`).
- **Type consistency:** renderers use `Extract<CoverHook, { kind: "..." }>`; union updated once (final list in Task 4 Step 1). `renderIcon(slug, {size,color})` and `escapeHtml` signatures match existing call sites.
- **Exhaustiveness caveat:** the cover hook branch is an `if/else` chain (not an exhaustive `switch`), so tsc will NOT flag a missing kind — each task adds both the schema member AND the `else if`, and each has a render test that would fail if the branch were missing.
```
