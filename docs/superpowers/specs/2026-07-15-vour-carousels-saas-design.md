# Vour Carousels SaaS — Design Spec

**Date:** 2026-07-15
**Status:** Approved (brainstorming) → ready for implementation planning
**Replaces:** GitHub Actions + Playwright + n8n pipeline (`.github/workflows/workflow.yml`, `scripts/*.py`)

---

## 1 · Purpose

A private, single-user, mobile-first web tool that turns a content idea into an on-brand @vourdev photo carousel and pushes it to Buffer — end to end from a phone browser. It replaces the old push-to-GitHub automation with an interactive app that keeps a human approval gate at each stage.

**Non-negotiables carried from the old system and the design system:**
- Output is 100% governed by the **Vour Dev Design System** (`DESIGN.md` is the single source of truth for styling).
- Canvas is **1080 × 1350 (4:5 photo carousel)** — NOT 1080×1920. (The old `arsitektur-carousel-cms.md` and `workflow.yml` said 1920; that is wrong per `DESIGN.md` bundle hard-rule #2 — 1920 crops slides on both IG and TikTok.)
- Export fidelity must match `scripts/export-slider-content.py`: identical layout, HD, vibrant sRGB color, no pixelation.
- Zero-cost operation (Vercel free, Gemini free tier, Cloudinary free, Turso/KV free).

---

## 2 · Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind |
| Hosting | Vercel (free tier) |
| AI orchestration | Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/deepseek`, `@ai-sdk/anthropic`) + `zod` |
| Models (dropdown, keys in `.env`) | Google Gemini (primary/free), DeepSeek, Claude |
| Auth | Better Auth — username+password, `disableSignUp:true`, single seeded user |
| Auth store | Minimal free store (Turso/LibSQL or Vercel KV) — holds ONLY the one user + sessions |
| Image export | `html-to-image` (client-side, in-browser) |
| Image hosting | Cloudinary (temp/archive) |
| Distribution | Buffer GraphQL API (`createPost`, notification + customScheduled) |

**Persistence model: stateless for content.** No database for carousels/drafts. All carousel state lives in browser (React) memory during a session. The only persistence is the auth store (one user + sessions). Optional future: download HTML / commit back to git — explicitly out of scope for MVP.

---

## 3 · Design-system alignment (styling contract)

The design system is vendored into the app (copied in, never cross-linked — skill rule #1):

```
public/ds/
  styles.css              # @import of tokens/*.css
  tokens/*.css            # fonts, colors, typography, spacing, radius, effects, icon, backgrounds, diagrams, reset
  TEMPLATE-editorial-v3.html   # master: 17 <section> slide roles, pre-styled, brand base64, vourdev-meta
  slides/*.html                # per-role specimens (reference / additional roles)
  brand base64                 # from DESIGN.md §3a (~26k chars, inline)
lib/ds/
  system-prompt.ts        # DESIGN.md / CUSTOM-INSTRUCTIONS text for the AI
```

**DESIGN.md governs styling in two places, and both MUST use these exact tokens:**

**A. The rendered carousel** — uses `tokens/*.css` verbatim. No inline styles, no re-derived values.

**B. The SaaS UI itself** — adopts the same editorial brand (NOT the current generic `globals.css` shadcn-neutral theme, which will be replaced):

Color tokens (`DESIGN.md §2`):
- `--ed-paper #FBF6EF` (bg, warm cream — never pure white), `--ed-paper-tint #F4ECDE`
- `--ed-ink #1F0904` (display/headline — never `#000`), `--ed-ink-soft #3D1F15`, `--ed-ink-muted #6E4B3E`, `--ed-ink-faint #A48C7E`
- `--ed-orange #E94B19` (accent only — **never on body**), `--ed-orange-soft #F2825D`
- Card tones (backgrounds only, never text): `--ed-card-peach #FBE9D9`, `-stone #EDE7DA`, `-mint #E3F1E1`, `-sky #DEEAF7`, `-pink #F7DDE6`, `-amber #FBE7B0`

Type (`DESIGN.md §3`): `--font-display Sora`, `--font-body Nunito`, `--font-mono JetBrains Mono`. Pinned scale only: 128 / 104 / 88 / 56 / 40 / 32 / 28 / 24 / 22. No Inter/Poppins/Roboto.

**Constraint rules enforced in prompts + review:** `--ed-orange` never on body; card tones never as text color; one accent `<span class="a">` word per headline; at most one element ≥ `--fs-title` per slide.

---

## 4 · Pipeline — 3 screens, 2 approval gates, both revisable

```
Screen A · Idea → Markdown brief          [GATE 1]
  input: topic/idea + model dropdown
  AI (generateText, sys prompt = MAKING_CAROUSELS §1 format + copy caps §11/§16)
    → Markdown brief in the design system's canonical brief format
  user reviews editable markdown ⟲
    - edit markdown text directly, OR
    - regenerate from topic
  approve →

Screen B · Brief → Carousel HTML          [GATE 2]
  AI (generateObject, zod slidePlan schema; sys prompt = DESIGN.md/CUSTOM-INSTRUCTIONS)
    → slidePlan JSON
  app assembles HTML: for each slide, take its role's <section> from TEMPLATE-v3,
    inject copy into placeholders, concat inside template shell (head/CSS/meta)
    → <iframe srcdoc> live preview (1080×1350 slides)
  user reviews rendered carousel ⟲
    - CHAT revision: "slide 3 overlaps" → AI patches the assembled HTML string
      (layout/overflow fixes live at HTML/CSS level), re-render iframe
    - or go back to Screen A
  approve →

Screen C · Export → Publish
  html-to-image per <section> @1080×1350 (see §6) → JPEG blobs (slide_01..NN)
  → Cloudinary upload → secure_url[]
  → Buffer createPost (notification, customScheduled) → appears in Buffer for manual upload
  vourdev-meta {title, caption, hashtags} parsed from HTML rides along
```

State machine held in React; nothing persisted server-side.

---

## 5 · AI layer

**Gate 1 — brief generation.** `generateText`. System prompt derived from `MAKING_CAROUSELS.md §1` canonical brief format (Content Info, per-slide roles, allowed subheadings) + copy caps (`DESIGN.md §11/§16`: eyebrow ≤3 words, headline within size cap, description ≤100 chars mockup / ≤140 text-only, conjunction check). Output = Markdown brief.

**Gate 2 — slide plan.** `generateObject` with a `zod` `slidePlan` schema:
```
slidePlan = {
  title: string,
  caption: string,
  hashtags: string[],
  slides: Array<{
    role: enum(<supported roles>),
    eyebrow?: string,        // ≤3 words
    headline?: string,
    accentWord?: string,     // the one <span class="a"> word
    description?: string,
    ...roleSpecificFields    // e.g. terminal.lines[], comparison.{junior,senior}, numbered.steps[], card.tone
  }>
}
```
System prompt = `DESIGN.md` / `bundle/CUSTOM-INSTRUCTIONS.md`. zod validation rejects off-cap copy → retry/repair before render.

**Revision (Gate 2).** Input = user chat message + current assembled HTML. AI returns patched HTML, constrained by the same system prompt (must not break tokens/type/canvas). Re-render iframe. (Chat patches HTML because overflow/overlap fixes are layout-level.)

**Multi-model.** One AI SDK provider swap via dropdown; keys in `.env`. Gemini default.

**Role phasing (scope lever).** The design system defines ~28 slide roles. MVP supports a **core set**: `cover`, `point` (info-card), `comparison`, `numbered` (solution), `terminal`, `outro`. Remaining roles (diagrams, extended mockup catalog: concept-hub, flow-chain, token-strip, comparison-bars, icon-hub, illustrated-scene, permission-table, recap-checklist, big-stat, pull-quote, split-panel, media-grid, browser-mockup, data-table, etc.) added incrementally after the core loop works. Each role = one `<section>` mapping from TEMPLATE-v3.

---

## 6 · Export — match `export-slider-content.py` exactly

The old script screenshots each `<section>` individually via Playwright. Client-side `html-to-image` must replicate its parameters so output is identical and not pixelated ("pecah"):

| Script behavior | Client `html-to-image` equivalent |
|---|---|
| `element.screenshot()` per `<section>` (clipped to bounding box) | capture each `<section>` node: `toJpeg(sectionEl, …)` |
| `device_scale_factor` (default 2; workflow used 1 = low-res risk) | **`pixelRatio: 2`** (configurable up to 3) — primary anti-pixel lever |
| `--force-color-profile=srgb` | browser-native rendering = already sRGB (arsitektur's reason for client-side: headless = pale colors) |
| `wait_until=networkidle` + 1500ms | `await document.fonts.ready` + all Iconify SVGs present + brand base64 decoded + ~400ms settle |
| jpg quality 85 (or png lossless) | `quality: 0.92` JPEG (PNG option for lossless) |
| ordered `slide_01..NN` | same naming, sorted |

**Anti-`pecah` safeguards (html-to-image drops external assets → broken glyphs/icons):**
1. **Inline fonts** as base64 `@font-face` (Sora, Nunito, JetBrains Mono) — do not depend on Google Fonts CDN at capture time.
2. **Icons inline as SVG** (Iconify rendered to inline SVG in the DOM before capture, not CDN-dependent `<span>`).
3. **Brand mark** already base64 (`DESIGN.md §3a`).
4. Capture at exact **1080×1350** box × pixelRatio.

**Fallback:** if any client fidelity gap appears, a server-side Playwright route reusing `export-slider-content.py` produces byte-identical output — but this is the fallback, not primary (headless = pale colors).

---

## 7 · Publish (Cloudinary + Buffer)

Server route (keeps tokens secret):
1. Receive JPEG blobs (ordered) from client.
2. Upload each to Cloudinary (`folder: vourdev-carousels`, `resource_type: image`) → collect `secure_url[]`. (Mirrors `scripts/notify.py`.)
3. Build Buffer GraphQL `createPost` from `query-buffer.js`: `schedulingType: notification`, `mode: customScheduled`, `dueAt`, `channelId` from env, `assets: [secure_url…]`, `metadata.tiktok.title`, `saveToDraft:false`. Escape caption/title.
4. POST to Buffer GraphQL → return post id/link. Content appears in the user's Buffer; final upload done manually there.

`.env`: AI provider keys, `BUFFER_TOKEN`, `BUFFER_CHANNEL_ID`, `CLOUDINARY_URL`, `APP_USERNAME`, `APP_PASSWORD`, `BETTER_AUTH_SECRET`, auth store URL/token.

---

## 8 · Auth

Better Auth, email/username + password:
- `emailAndPassword.enabled = true`, `disableSignUp = true`. Single user seeded from `APP_USERNAME`/`APP_PASSWORD` on first boot.
- API route `app/api/auth/[...all]/route.ts` via `toNextJsHandler(auth)`.
- Middleware guards all app pages + AI/publish API routes; unauthenticated → login.
- Signed cookie sessions. Minimal Turso/LibSQL (or Vercel KV) store for the user + session rows.

**Noted tension:** content is stateless/no-DB, but Better Auth needs a store for the user/session. Resolved by scoping the store to auth only (one user), on a free tier. This does not make carousel content stateful.

---

## 9 · Component boundaries

- `lib/ai/` — provider registry (model dropdown → AI SDK provider), brief prompt, slidePlan schema + prompt, revise prompt. Pure, testable.
- `lib/ds/` — vendored system prompt text; role→`<section>` template map; HTML assembler (slidePlan → HTML string); metadata (`vourdev-meta`) reader.
- `lib/export/` — html-to-image wrapper (fonts/icons ready gate, per-section capture, pixelRatio/quality). Pure over a DOM node.
- `lib/publish/` — Cloudinary upload, Buffer mutation builder + client. Server-only.
- `app/` — 3 screens (A/B/C) + auth pages + API routes.

Each unit has one purpose, a typed interface, and is testable in isolation.

---

## 10 · Out of scope (YAGNI)

- git-commit-back of final HTML
- multi-user / roles
- database for carousel content
- 1080×1920 / video reels layout
- post analytics, Buffer queue management UI
- full 28-role support at launch (phased — see §5)

---

## 11 · Open risks

1. **Better Auth needs a store** despite stateless content → free Turso/KV, auth-only (§8).
2. **html-to-image fidelity** — must inline fonts + icons and gate on load, else broken glyphs (§6). Verify against `EXAMPLE-editorial.html` visually.
3. **28-role zod schema is large** → phase roles (§5).
4. **Chat-patched HTML can drift off-brand** → constrain with system prompt + re-validate tokens/canvas.
5. **Buffer credentials** — needs Buffer app token + `channelId`; assets must be public URLs (Cloudinary); notification mode = manual final post.
6. **Serverless Playwright fallback** heavy on Vercel (chromium size) — only if client export proves insufficient.
