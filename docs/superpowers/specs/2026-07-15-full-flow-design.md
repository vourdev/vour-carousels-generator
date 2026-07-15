# Vour Carousels — End-to-End Flow Spec (AI → Preview → Export → Publish)

**Date:** 2026-07-15
**Status:** Approved (brainstorming) → ready for implementation planning
**Extends:** `2026-07-15-vour-carousels-saas-design.md` (§4 pipeline, §5 AI, §7 publish). Builds on shipped Plans 1–3 (auth + shadcn UI, `slidePlan → template HTML → /preview`, `html-to-image` JPEG export).

---

## 1 · Purpose

Complete the product: a chat-style wizard that turns a content idea into an on-brand @vourdev carousel and schedules it to Instagram + TikTok via Buffer — with a human approval gate at the brief, the HTML, and the export. Multi-model (Gemini free by default; DeepSeek/MIMO opt-in), zero-cost on Gemini.

Covers the two remaining build plans:
- **Plan 4** — AI generation + the brief/HTML gates + revision.
- **Plan 5** — Publish (Cloudinary + Buffer to IG + TikTok).

Export (step ④) is already shipped in Plan 3 (JPEG, 1080×1350, pixelRatio 2).

---

## 2 · The wizard (state machine)

A single stateless session held in React (no DB). Steps:

```
① IDEA        chat input; user types the idea + selects a model (dropdown).
② BRIEF gate  AI generateText → Markdown brief (MAKING_CAROUSELS §1 format + copy caps).
              User: approve → ③, or revise (edit the markdown, or chat instruction → regenerate).
③ HTML gate   AI generateObject(slidePlanSchema) → assembleCarousel → scaled /preview iframe.
              User: approve → ④, or revise via chat ("slide 3 overflows") → AI patches the
              slidePlan (re-validated) → re-render.
④ EXPORT      html-to-image → JPEG blobs (slide_01..NN, 1080×1350 ×2). Reuses Plan 3.
              If the images show issues → return to ③ (revise) → re-export.
⑤ PUBLISH     confirm → Cloudinary upload → Buffer createPost (IG + TikTok, notification,
              customScheduled at a chosen dueAt). Content lands in Buffer for manual posting.
```

State object (session, in-memory): `{ idea, model, brief, slidePlan, html, images: Blob[], schedule }`. Each step is a focused component; transitions are explicit.

---

## 3 · AI layer (server-only)

All model calls run server-side (Server Actions / route handlers) so API keys never reach the client.

**Provider registry — `lib/ai/registry.ts`:**
- Gemini — `@ai-sdk/google`, key `GOOGLE_GENERATIVE_AI_API_KEY` (free tier), **default**.
- DeepSeek — `@ai-sdk/deepseek`, key `DEEPSEEK_API_KEY` (optional, paid).
- MIMO — `@ai-sdk/openai-compatible`, `MIMO_API_KEY` + `MIMO_BASE_URL` (optional, paid, OpenAI-compatible endpoint).
- `availableModels()` returns only models whose key is present in `.env`; the dropdown lists exactly those. Gemini is the fallback default.

**Gate 1 — brief.** `generateText`; system prompt derived from `MAKING_CAROUSELS.md §1` (canonical brief format, slide roles, allowed subheadings) + `DESIGN.md §11/§16` copy caps. Input = idea. Output = Markdown brief.

**Gate 2 — slidePlan.** `generateObject` with `slidePlanSchema` (from Plan 2, `lib/ds/schema.ts`); system prompt = `DESIGN.md` / `bundle/CUSTOM-INSTRUCTIONS.md`. Input = approved brief. Output = `SlidePlan` → `assembleCarousel` (Plan 2) → HTML. zod validation rejects off-cap output → repair/retry before render.

**HTML revision (gate 2).** Input = user chat message + current `SlidePlan`. `generateObject` returns a patched `SlidePlan` (NOT raw HTML — patching the structured plan keeps zod validation and branding intact). Re-assemble + re-render. Overflow/overlap fixes are expressed as content edits (shorten copy, change role) per the design system's "cut copy, don't touch CSS" rule.

**Model verification:** confirm current Vercel AI SDK API (`generateObject`/`generateText`, provider packages) via context7 before implementing.

---

## 4 · Export (shipped — Plan 3)

Reused as-is: `captureCarousel(html)` → JPEG blobs per `<section>` at 1080×1350, `pixelRatio: 2`, `quality: 0.92`, fonts inlined, Iconify inlined. Matches the deleted `export-slider-content.py` fidelity. Step ④ calls it; on "issues" the wizard returns to ③.

---

## 5 · Publish (Plan 5)

Server route (keeps tokens secret):
1. Receive ordered JPEG blobs from the client.
2. Upload each to **Cloudinary** (`folder: vourdev-carousels`, `resource_type: image`) → `secure_url[]` (mirrors the old `notify.py`).
3. Build **Buffer** GraphQL `createPost` per `query-buffer.js` (preserved in the base spec §12): `schedulingType: notification`, `mode: customScheduled`, `dueAt` (from the wizard's date/time picker), `assets: [secure_url…]`, `metadata.tiktok.title`, `saveToDraft: false`.
4. **Two channels** — post to `BUFFER_IG_CHANNEL_ID` and `BUFFER_TIKTOK_CHANNEL_ID` (one `createPost` per channel; combine into channelIds if the Buffer API accepts a list). TikTok carries `metadata.tiktok.title`; IG carries the caption.
5. Return the Buffer post ids/links. Content appears in the user's Buffer for manual finalization.

`vourdev-meta` (title/caption/hashtags) is read from the assembled HTML and supplies the caption/title/hashtags.

---

## 6 · UI (shadcn + Vercel theme)

Conversational wizard page (`/create` or the home route): a message/step list + input bar. Brief shown as an editable shadcn Card; HTML shown in the scaled `/preview` frame (Plan 3); export + publish as action steps with pending/error/success states. Model dropdown in the composer. All components shadcn/ui on the Vercel token set. Carousel content stays Vour Dev.

---

## 7 · Persistence, errors, env

- **Stateless** — the wizard session lives in browser memory; nothing persisted server-side (auth store remains the only persistence). Refresh loses the draft (acceptable; optional future: save draft).
- **Errors** — each AI/upload/publish call surfaces a typed error in its step with a retry; AI validation failures trigger one automatic repair attempt before showing the error.
- **`.env`:** `GOOGLE_GENERATIVE_AI_API_KEY`, `DEEPSEEK_API_KEY?`, `MIMO_API_KEY?`, `MIMO_BASE_URL?`, `BUFFER_TOKEN`, `BUFFER_IG_CHANNEL_ID`, `BUFFER_TIKTOK_CHANNEL_ID`, `CLOUDINARY_URL` (plus the existing auth vars).

---

## 8 · Component boundaries

- `lib/ai/registry.ts` — providers + `availableModels()`; pure over env.
- `lib/ai/brief.ts` — gate-1 prompt + `generateBrief(idea, model)`.
- `lib/ai/plan.ts` — gate-2 prompt + `generateSlidePlan(brief, model)` + `reviseSlidePlan(plan, message, model)`; output validated by `slidePlanSchema`.
- `lib/publish/cloudinary.ts` — `uploadImages(blobs) → string[]` (server).
- `lib/publish/buffer.ts` — `schedulePost({ urls, title, caption, hashtags, dueAt, channelId }) → postId` (server) + a helper to post to both channels.
- `app/(wizard)/…` — step components + Server Actions wiring the above.

Each unit: one purpose, typed interface, testable (AI/network mocked; pure prompt/registry logic unit-tested).

---

## 9 · Out of scope (YAGNI)

- Draft persistence / history (stateless).
- Direct auto-posting to IG/TikTok (Buffer notification = manual finalize).
- Video/Reels (1080×1350 photo carousel only).
- Analytics, A/B, scheduling queues beyond a single dueAt.
- AI Gateway (per-provider keys instead; Gateway isn't free).

---

## 10 · Open risks

1. **MIMO endpoint** — treat as OpenAI-compatible; verify base URL + model id when a key is provided.
2. **Buffer multi-channel** — confirm whether `createPost` accepts multiple channelIds or needs one call per channel; the buffer helper abstracts this.
3. **Cloudinary free tier** — sufficient for single-user; secure_urls must be public for Buffer to fetch.
4. **AI cost** — only Gemini is free; DeepSeek/MIMO bill per token. Dropdown hides models without keys.
5. **Structured-output reliability** — `generateObject` may fail schema; one repair retry, then surface the error.
