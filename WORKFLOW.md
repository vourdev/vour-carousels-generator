# Workflow Pembuatan Carousel - Vour Carousels

**Tanggal:** 2026-08-03  
**Project:** Vour Carousels SaaS  
**Purpose:** Dokumentasi lengkap workflow pembuatan carousel dari ide sampai publikasi

---

## Overview

Vour Carousels adalah aplikasi web single-user yang mengubah ide konten menjadi carousel Instagram/TikTok siap posting. Workflow terdiri dari **5 langkah utama** dengan **2 approval gate** (Gate 1: Brief Review, Gate 2: Design Review).

---

## Stack & Dependencies

### Core Technologies
- **Framework:** Next.js 16.2.10 (App Router)
- **Runtime:** React 19.2.4
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Auth:** Better Auth 1.6.23
- **Database:** LibSQL/Turso (auth + history)

### AI & Content Generation
- **AI SDK:** Vercel AI SDK 7.0.28
- **Models:** 
  - Google Gemini (default, free tier)
  - DeepSeek Chat
  - OpenRouter
  - OmniRoute (VourDev custom)
- **Schema Validation:** Zod 4.4.3

### Image Processing & Export
- **Client Export:** html-to-image 1.11.13 (browser-side screenshot)
- **Server Export:** Playwright 1.61.1 (n8n automation)
- **Image Hosting:** Cloudinary 2.10.0
- **Distribution:** Buffer API (scheduling)

### Design System
- **Canvas Size:** 1080 × 1350 px (4:5 ratio)
- **Fonts:** Sora (display), Nunito (body), JetBrains Mono (code)
- **Icons:** Lucide React 1.24.0 (36 curated icons, self-hosted inline SVG)
- **Color Palette:** Editorial warm theme (ed-paper, ed-ink, ed-orange)

---

## Workflow Steps

### Step 0: Authentication & Setup

**Location:** `/login`

1. User login dengan Better Auth (username + password)
2. Session validation via `requireSession()` di setiap protected route
3. Redirect ke `/` (home/calendar) atau `/create` (wizard)

---

### Step 1: Ide → Brief Outline (Gate 1)

**Location:** `/create` - Step 1  
**File:** `app/create/wizard.tsx`

#### Input Options

**A. Manual Input**
- User ketik ide/topik di input field
- Contoh: "idempotency di API", "React hooks untuk pemula"

**B. Topic Bank**
- Dropdown dengan search (popover)
- Data dari database `topic` table
- Filter by status: `idea`, `queued`, `generated`, `published`

**C. Import File**
- Upload `.md` file (brief markdown manual)
- Upload `.html` file (bypass AI, langsung ke export)

#### AI Generation Flow

```
User Input (idea)
    ↓
Select AI Model (dropdown: gemini/deepseek/omniroute)
    ↓
Click Send Icon → runBriefGeneration()
    ↓
POST /api/generate-brief
    {
      idea: string,
      modelId: ModelId
    }
    ↓
Server: generateBrief(idea, model)
    - System prompt: MAKING_CAROUSELS format
    - Copy constraints: max headline 90 chars, body 160 chars
    - Output: Markdown brief (canonical format)
    ↓
Typewriter animation (setInterval, 4 chars per 15ms)
    ↓
Brief Markdown displayed in editor
```

#### Cancel/Abort

- **Square (Stop) Icon:** Abort fetch via `AbortController`
- **AbortSignal** passed ke fetch request
- Server-side generation stopped (tidak waste resources)

#### Brief Format (Markdown)

```markdown
# [Judul Carousel]

[Eyebrow / Category]

## Intro / Hook
[Opening statement yang engaging]

## Slide 1: [Point Title]
- [Bullet point 1]
- [Bullet point 2]

## Slide 2: [Point Title]
- [Bullet point 1]
- [Bullet point 2]

... (repeat untuk 5-10 slides)

## Outro / CTA
[Closing + call-to-action]

---
**Caption:**
[Instagram/TikTok caption text]

**Hashtags:**
#hashtag1 #hashtag2 #hashtag3
```

#### User Review & Edit

**View Modes:**
1. **Split View** (default): Raw markdown (left) + formatted preview (right)
2. **Raw Editor**: Full-width markdown editor
3. **Formatted Preview**: Full-width rendered markdown

**Edit Options:**
- Direct text edit di markdown editor
- AI revision: Input instruksi → revisi brief via `/api/generate-brief` (revision mode)
- Regenerate: Klik model dropdown → generate ulang dari ide awal

**Approval:**
- Klik "Approve & Render Slide" → proceed ke Step 2

---

### Step 2: Brief → Slide Design (Gate 2)

**Location:** `/create` - Step 2  
**File:** `app/create/wizard.tsx`

#### AI Slide Plan Generation

```
Approved Brief Markdown
    ↓
handlePlanGeneration()
    ↓
planAction(brief, modelId) [server action]
    ↓
generateSlidePlan(brief, model)
    - System prompt: DESIGN.md + CUSTOM-INSTRUCTIONS
    - Schema: SlidePlan (Zod validation)
    - Output: JSON structure dengan slide roles
    ↓
assembleCarousel(plan)
    - Ambil HTML template per role dari TEMPLATE-v3
    - Inject copy ke placeholders
    - Concat slides + CSS + fonts inline
    ↓
HTML carousel (1080×1350 per <section>)
```

#### SlidePlan Schema

```typescript
interface SlidePlan {
  title: string;
  caption: string;
  hashtags: string[];
  slides: Slide[];
}

interface Slide {
  role: SlideRole; // "cover" | "point" | "terminal" | "comparison" | ...
  tone: ToneColor; // "peach" | "mint" | "sky" | "pink" | ...
  // Role-specific fields (headline, body, points, mockup, etc.)
}
```

#### Slide Roles (Design System)

**Core Roles (MVP):**
- `cover`: Intro slide dengan eyebrow + headline + lede
- `cover-compact`: Intro dengan device-frame hook
- `point`: Info card dengan icon + headline + body
- `comparison`: Side-by-side comparison (2 kolom)
- `steps`: Numbered steps (solution-oriented)
- `terminal`: Code snippet dengan syntax
- `callout`: Dark callout box
- `bigstat`: Large statistic display
- `outro`: Closing + CTA

**Extended Roles:**
- `hub`: Icon hub dengan 6-9 items
- `flow`: Flow diagram dengan arrows
- `concept`: Concept explainer
- `checklist`: Recap checklist

#### Preview & Revision

**Tabs:**
1. **Live Preview**: iframe dengan HTML carousel (navigasi slide)
2. **Outline Brief**: Edit markdown brief

**Revision Flow:**
- User input instruksi revisi (chat-style)
- `reviseAction(plan, message, modelId)` → patch HTML/CSS level
- Re-render iframe dengan updated HTML

**Approval:**
- Klik "Approve & Export JPEGs" → proceed ke Step 3

---

### Step 3: Export → JPEG Assets

**Location:** `/create` - Step 3  
**File:** `lib/export/capture.ts`

#### Client-Side Export Flow

```
HTML Carousel (dalam iframe)
    ↓
handleExport()
    ↓
captureCarousel(iframeDoc)
    ↓
For each <section>:
    1. Wait document.fonts.ready
    2. Wait icons rendered (inline SVG)
    3. toJpeg(sectionEl, {
         quality: 0.92,
         pixelRatio: 2, // HD (2x) atau Ultra HD (3x)
         cacheBust: true
       })
    ↓
Blob[] (JPEG images, 1080×1350 each)
    ↓
Object URLs untuk preview
    ↓
Save to state: exportedImages[]
```

#### Export Parameters

| Parameter | Value | Reason |
|-----------|-------|--------|
| `pixelRatio` | `2` (default) | HD export, anti-pixelation |
| `quality` | `0.92` | JPEG quality (balance size vs quality) |
| `cacheBust` | `true` | Force re-render, hindari cache |
| Format | JPEG | Instagram/TikTok optimal format |
| Naming | `slide_01.jpg`, `slide_02.jpg`, ... | Sequential, sortable |

#### Preview Grid

- Grid 2-4 kolom (responsive)
- Thumbnail per slide (aspect ratio 4:5)
- Download individual slide (klik thumbnail)
- Download all as ZIP (klik "Download All ZIP")

**Proceed:**
- Klik "Lanjut ke Penjadwalan" → Step 4

---

### Step 4: Schedule & Publish

**Location:** `/create` - Step 4  
**File:** `app/create/actions.ts` → `publishAction()`

#### Platform Configuration

**Instagram:**
- Env: `BUFFER_IG_CHANNEL_ID`
- Format: Carousel (multiple JPEGs)
- Caption: `{caption}\n\n{hashtags}`

**TikTok:**
- Env: `BUFFER_TIKTOK_CHANNEL_ID`
- Format: Photo carousel
- Title: `plan.title`
- Caption: `{caption}\n\n{hashtags}`

#### Scheduling Flow

```
User pilih datetime (datetime-local input)
    ↓
handlePublish()
    ↓
For each JPEG blob:
    1. Convert blob → base64
    2. POST /api/create/actions → uploadSingleImageAction(base64)
    3. Cloudinary upload → secure_url
    ↓
Collected: imageUrls[]
    ↓
publishAction(imageUrls, plan, dueAt)
    ↓
For each active channel (IG/TikTok):
    1. scheduleBufferPost({
         channelId,
         text: caption + hashtags,
         assets: imageUrls,
         dueAt,
         isTikTok: (channel === TikTok),
         title: (TikTok only)
       })
    2. Buffer API: createPost (notification + customScheduled)
    ↓
Return: { igPostId, ttPostId }
    ↓
Save to database (carousel history)
```

#### Alternative: Save to Stock

- **Button:** "Save to Stock Content"
- Flow sama dengan publish, tapi:
  - `status: "draft"` (tidak `"scheduled"`)
  - Tidak kirim ke Buffer
  - Simpan di database untuk upload manual nanti

#### Success State

- Display: "Berhasil!"
- Show: Instagram Post ID, TikTok Post ID
- Button: "Buat Konten Baru" → reset wizard ke Step 1

---

## Database Schema

### Tables

**1. user** (Better Auth)
- `id` (primary key)
- `email`
- `name`
- `createdAt`, `updatedAt`

**2. session** (Better Auth)
- `id` (primary key)
- `userId` (foreign key)
- `token`
- `expiresAt`
- `createdAt`, `updatedAt`

**3. carousel** (History)
- `id` (primary key)
- `userId` (foreign key)
- `source`: `"ai"` | `"upload"`
- `title`
- `caption`
- `hashtags` (JSON array)
- `slideCount`
- `model`: ModelId
- `status`: `"draft"` | `"scheduled"` | `"published"` | `"failed"`
- `thumbnail` (first image URL)
- `imageUrls` (JSON array)
- `bufferIgId`, `bufferTtId`
- `dueAt` (scheduled time)
- `createdAt`, `updatedAt`

**4. topic** (Topic Bank)
- `id` (primary key)
- `userId` (foreign key)
- `title`
- `description`
- `status`: `"idea"` | `"queued"` | `"generated"` | `"published"`
- `carouselId` (foreign key, nullable)
- `createdAt`, `updatedAt`

---

## API Routes

### Client-Facing (Auth Required)

**1. POST /api/generate-brief**
- Body: `{ idea: string, modelId: ModelId }`
- Response: `{ brief: string }`
- Abortable: Yes (AbortController)

**2. POST /api/generate-brief-from-topic**
- Body: `{ topicId: string, modelId: ModelId }`
- Response: `{ brief: string }`
- Abortable: Yes (AbortController)

**3. POST /api/generate-plan**
- Body: `{ type: "plan", brief: string, modelId: ModelId }`
- Response: `{ plan: SlidePlan }`
- Abortable: No (uses useTransition)

**4. POST /api/generate-plan** (revision)
- Body: `{ type: "revise", plan: SlidePlan, message: string, modelId: ModelId }`
- Response: `{ plan: SlidePlan }`
- Abortable: No (uses useTransition)

### Server Actions

**1. briefAction(idea, modelId)**
- Generate brief dari ide
- Return: `string` (markdown)

**2. planAction(brief, modelId)**
- Generate slide plan dari brief
- Return: `SlidePlan` (Zod validated)

**3. reviseAction(plan, message, modelId)**
- Revise slide plan dengan instruksi
- Return: `SlidePlan` (updated)

**4. publishAction(urls, plan, dueAt)**
- Upload ke Cloudinary + schedule ke Buffer
- Return: `{ igPostId?, ttPostId? }`

**5. uploadSingleImageAction(base64Image)**
- Upload single image ke Cloudinary
- Return: `string` (secure_url)

### n8n Automation Endpoint

**POST /api/n8n-generate**
- Auth: `x-api-key` header (BETTER_AUTH_SECRET)
- Body: `{ topic: string }`
- Flow:
  1. Generate 2 carousels (Panduan Praktis + Deep Dive)
  2. Export JPEGs via Playwright server-side
  3. Upload ke Cloudinary
  4. Schedule ke Buffer (12:00 PM dan 12:30 PM)
- Response: `{ success: true, carousels: [...] }`

---

## Design System Integration

### File Structure

```
lib/ds/
  ├── schema.ts           # Zod schemas (SlidePlan, Slide)
  ├── assemble.ts         # Assemble HTML dari plan
  ├── render-slide.ts     # Render individual slide
  ├── carousel-css.ts     # Main CSS bundle (verbatim from DESIGN.md)
  ├── carousel-css-extra.ts  # Editorial intro styles
  ├── fonts-inline.ts     # Base64 font faces (Sora/Nunito/JetBrains)
  ├── icons.ts            # Icon API (normalizeIcon, renderIcon)
  ├── icons.generated.ts  # Generated inline SVG map
  ├── brand.ts            # Brand logo base64
  ├── sample.ts           # Sample plan (test fixture)
  ├── templates/
  │   ├── cover.ts
  │   ├── cover-compact.ts
  │   ├── point.ts
  │   ├── terminal.ts
  │   ├── comparison.ts
  │   ├── steps.ts
  │   ├── callout.ts
  │   ├── bigstat.ts
  │   ├── outro.ts
  │   ├── hub.ts
  │   ├── flow.ts
  │   ├── concept.ts
  │   └── checklist.ts
```

### Icon System

**Allowlist (36 icons):**
```
terminal, server, database, key, shield-check, lock, git-branch, 
code, cpu, network, cloud, zap, repeat, arrow-right, alert-triangle, 
check-circle, x-circle, circle-alert, sparkles, layers, box, workflow, 
timer, gauge, bug, wrench, rocket, book-open, lightbulb, target, 
trending-up, file-code, braces, webhook, refresh-cw, folder
```

**Generation:**
```bash
npm run gen:icons  # scripts/gen-icons.mjs
```
- Read `lucide-react` node modules
- Extract SVG paths untuk allowlisted slugs
- Write ke `lib/ds/icons.generated.ts`
- Fail loudly jika slug tidak ditemukan (strict enforcement)

**Usage:**
```typescript
import { renderIcon, normalizeIcon, ICON_SLUGS } from "@/lib/ds/icons";

// Normalize + fallback
const slug = normalizeIcon("lucide:sparkles"); // → "sparkles"

// Render inline SVG
const svg = renderIcon("sparkles", { size: 24, color: "#E94B19" });
```

---

## Error Handling

### AI Generation Errors

**Quota/Rate Limit:**
- Message: "Batas kuota API terlampaui. Silakan coba beberapa saat lagi."
- Action: User wait atau switch model

**High Demand:**
- Message: "Server model sedang sibuk. Silakan coba lagi nanti."
- Action: Retry atau switch model

**Invalid API Key:**
- Message: "Konfigurasi API Key tidak valid. Periksa .env"
- Action: Admin check `.env` file

**Model Not Available:**
- Message: "Model yang dipilih sudah tidak tersedia."
- Action: Switch ke model lain

### Export Errors

**Fonts Not Ready:**
- Wait `document.fonts.ready` sebelum capture
- Fallback: 400ms settle timeout

**Icons Missing:**
- Inline SVG dari `icons.generated.ts` (no CDN)
- Fallback: `sparkles` icon

**Image Too Large:**
- Compress JPEG quality (0.92 → 0.85)
- Reduce pixelRatio (2 → 1)

### Upload Errors

**Cloudinary Quota:**
- Message: "Gagal upload gambar ke Cloudinary."
- Action: Check Cloudinary dashboard

**Buffer API Error:**
- Message: "Gagal menjadwalkan ke Buffer."
- Action: Check Buffer credentials + channel IDs

---

## Testing

### Test Structure

```
test/
  ├── ds/                   # Design system tests
  │   ├── icons.test.ts     # Icon normalization + rendering
  │   ├── schema.test.ts    # Zod validation
  │   ├── assemble.test.ts  # HTML assembly
  │   ├── render-slide.test.ts  # Individual slide rendering
  │   └── sample.test.ts    # Sample plan validation
  ├── ai/                   # AI generation tests
  │   ├── generate.test.ts  # Brief + plan generation
  │   └── prompts.test.ts   # Prompt system validation
  └── export/               # Export tests (if any)
```

### Run Tests

```bash
npm test              # Run all tests (vitest run)
npm run test:watch    # Watch mode (vitest)
```

---

## Development Commands

```bash
# Development
npm run dev           # Start Next.js dev server (localhost:3000)

# Build & Deploy
npm run build         # Production build
npm start             # Start production server

# Database
npm run db:migrate           # Run auth schema migration
npm run db:migrate-topics    # Run topic schema migration
npm run db:seed              # Seed single user (ALLOW_SIGNUP=true)

# Code Generation
npm run gen:icons     # Generate icon SVG map
npm run gen:bundle    # Generate design system bundle

# Code Quality
npm run lint          # ESLint check
npm test              # Run tests
npx tsc --noEmit      # TypeScript check
```

---

## Environment Variables

```bash
# Auth & Database
DATABASE_URL="libsql://[host]"
DATABASE_AUTH_TOKEN="[token]"
BETTER_AUTH_SECRET="[random-string]"
BETTER_AUTH_URL="http://localhost:3000"
APP_USERNAME="your@email.com"
APP_PASSWORD="YourPassword123"

# AI Models
GOOGLE_GENERATIVE_AI_API_KEY="[gemini-key]"  # Default
DEEPSEEK_API_KEY="[deepseek-key]"            # Optional
OPENROUTER_API_KEY="[openrouter-key]"        # Optional
OMNIROUTE_API_KEY="[omniroute-key]"          # VourDev custom

# Image & Publishing
CLOUDINARY_URL="cloudinary://[key]:[secret]@[cloud]"
BUFFER_TOKEN="[buffer-api-token]"
BUFFER_IG_CHANNEL_ID="[instagram-channel-id]"
BUFFER_TIKTOK_CHANNEL_ID="[tiktok-channel-id]"

# n8n Automation
SERVER_TOKEN_API_N8N="[n8n-api-token]"
NOTION_TOKEN="[notion-integration-token]"
NOTION_DATABASE_ID="[notion-database-id]"
```

---

## Deployment (Vercel)

### Setup Steps

1. **Push code ke GitHub**
2. **Import project ke Vercel**
3. **Set environment variables** (semua vars dari `.env`)
4. **Run migrations:**
   ```bash
   # Local dengan Turso remote URL
   npm run db:migrate
   npm run db:migrate-topics
   npm run db:seed
   ```
5. **Deploy** (auto-deploy dari main branch)

### Vercel Configuration

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### Post-Deploy

- Test login di production URL
- Test carousel generation end-to-end
- Verify Buffer scheduling works
- Check Cloudinary uploads

---

## n8n Automation Integration

### Notion → n8n → Vour Carousels

**Flow:**
1. Notion database dengan kolom `Topic` (Title) dan `Status` (Select)
2. n8n workflow runs midnight (00:00) daily
3. Query Notion untuk rows dengan `Status = "Ready"`
4. POST ke `/api/n8n-generate` dengan topic
5. Vour Carousels generate 2 carousels + schedule ke Buffer
6. n8n update Notion row `Status = "Scheduled"`

**n8n Workflow:**
- File: `n8n-carousel-notion-workflow.json`
- Trigger: Schedule (Cron: `0 0 * * *`)
- Nodes:
  1. Notion (Get Next Topic)
  2. HTTP Request (Vour API)
  3. Notion (Update Status to Scheduled)

**Setup:**
1. Import workflow JSON ke n8n
2. Connect Notion credentials (Integration Token)
3. Set Vour API endpoint + `x-api-key` header
4. Activate workflow

---

## Performance Optimization

### Client-Side

**Code Splitting:**
- Next.js automatic code splitting per route
- React lazy loading untuk heavy components

**Image Optimization:**
- JPEG compression (quality 0.92)
- Client-side resize via `html-to-image`
- Cloudinary CDN untuk delivery

**Bundle Size:**
- Tree-shaking unused AI SDK providers
- Self-hosted fonts (no external requests)
- Inline icons (no Iconify CDN)

### Server-Side

**API Routes:**
- Vercel Edge Functions untuk static content
- Node.js runtime untuk AI generation (streaming support)

**Database:**
- LibSQL/Turso (low latency, globally distributed)
- Minimal queries (auth + history only)

**AI Generation:**
- Streaming responses (via AI SDK)
- AbortController untuk cancel support
- Model failover (primary → fallback)

---

## Accessibility

### Keyboard Navigation

- Tab navigation untuk all interactive elements
- Enter/Space untuk button activation
- Escape untuk close modals/popovers
- Arrow Up/Down untuk prompt history

### Screen Readers

- Semantic HTML (`<main>`, `<section>`, `<nav>`)
- ARIA labels untuk icon-only buttons
- Alt text untuk images
- Status announcements (via `toast`)

### Color Contrast

- WCAG AA compliant (4.5:1 ratio)
- Editorial theme designed untuk readability
- No color-only information (icon + text)

---

## Security

### Authentication

- Better Auth session management
- HTTP-only cookies
- CSRF protection (Better Auth built-in)
- Single-user mode (no public registration)

### API Security

- Server actions require session
- API routes check `requireSession()`
- n8n endpoint requires `x-api-key` header
- No sensitive data in client state

### Data Privacy

- No analytics/tracking
- User data di Turso database (private)
- Cloudinary images private by default
- Buffer credentials di server only

---

## Troubleshooting

### Common Issues

**1. "Invalid API Key"**
- Check `.env` file ada `GOOGLE_GENERATIVE_AI_API_KEY`
- Verify key valid di Google AI Studio

**2. "Quota Exceeded"**
- Gemini free tier limit reached
- Wait 24 hours atau switch ke DeepSeek/OpenRouter

**3. "Fonts not loading"**
- Check `lib/ds/fonts-inline.ts` ada base64 data
- Run `npm run gen:bundle` jika perlu regenerate

**4. "Icons missing"**
- Run `npm run gen:icons` untuk regenerate icon map
- Check icon slug ada di allowlist

**5. "Buffer scheduling failed"**
- Verify `BUFFER_TOKEN` valid
- Check channel IDs correct (`BUFFER_IG_CHANNEL_ID`, `BUFFER_TIKTOK_CHANNEL_ID`)
- Test Buffer API di https://buffer.com/developers/api

**6. "Database migration failed"**
- Check Turso connection (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`)
- Run migrations in order (auth first, topics second)

---

## Changelog

### 2026-08-03
- **Cancel/Abort support:** Added AbortController untuk cancel in-progress generation
- **Topic Bank search:** Dropdown dengan search filter
- **Icon system:** Self-hosted inline SVG (no CDN dependency)
- **API routes:** Convert server actions ke fetch-based API (abortable)

### 2026-07-23
- **Icon reliability:** Inline SVG generation dari `lucide-react`
- **DS variety:** Expanded mockup types (hub/flow/concept/checklist)
- **Editorial intro:** Text-only cover layout

### 2026-07-20
- **Cover/Hook/Outro:** Enhanced intro slide options
- **CTA design:** Improved closing slide templates

### 2026-07-15
- **Initial SaaS MVP:** Full workflow implementation
- **Design system integration:** TEMPLATE-v3 templates
- **Export fidelity:** HD JPEG export matching legacy script

---

## Resources

### Documentation
- Design System: `Vour Dev Design System/DESIGN.md`
- Making Carousels: `Vour Dev Design System/MAKING_CAROUSELS.md`
- Specs: `docs/superpowers/specs/`
- Plans: `docs/superpowers/plans/`

### External Links
- Buffer API: https://buffer.com/developers/api
- Cloudinary Docs: https://cloudinary.com/documentation
- Better Auth: https://better-auth.com
- Vercel AI SDK: https://sdk.vercel.ai/docs
- Next.js: https://nextjs.org/docs

---

**Last Updated:** 2026-08-03  
**Maintainer:** @vourdev  
**Version:** 1.0.0
