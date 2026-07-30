# Topic Bank & AI Brief Generator

## Overview

Topic Bank adalah sistem untuk manage content ideas dan automate brief generation untuk daily carousel posting (7x/week). System ini terintegrasi penuh dengan carousel workflow yang sudah ada.

## Features

### 1. Topic Management
- **Manual Topic Entry**: Add custom topic ideas
- **AI Topic Generation**: Generate ideas batch (default 7)
- **Weekly Planning**: Auto-generate 7 topics (Mon-Sun, `scheduled_date` terisi per hari)
- **Monthly Planning**: Auto-generate 28 topics (4 minggu penuh, satu topic per hari)
- **Quality Parameters**: `focusArea`, free-text `directives`, dan `research` (riset web
  tren/berita dev terkini via Gemini google_search grounding sebelum generate)
- **Category Filtering**: Filter by content category
- **Status Tracking**: Track topic dari idea → published

### 2. AI-Powered Generation
- **Smart Topic Suggestions**: AI generate topics based on Vour positioning
- **Batch Brief Generation**: Generate multiple briefs sekaligus
- **Context-Aware**: AI understands Vour brand, audience, dan content strategy
- **Trend-Aware**: Prioritize trending topics dalam dev community

### 3. Workflow Integration
- Direct integration dengan `/create` page
- Auto-link topics ke generated carousels
- Status tracking throughout content lifecycle

## Database Schema

```sql
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  keywords TEXT NOT NULL (JSON array),
  angle TEXT,
  status TEXT NOT NULL DEFAULT 'idea',
  priority INTEGER NOT NULL DEFAULT 0,
  scheduled_date TEXT,
  carousel_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id)
)
```

## Topic Categories

1. **ai-workflow**: AI automation, AI tools, LLM workflows
2. **developer-tools**: VSCode extensions, CLI tools, productivity apps
3. **automation**: Build automation, CI/CD, scripting
4. **nextjs**: Next.js tips, patterns, best practices
5. **angular**: Angular concepts, architecture
6. **productivity**: Developer productivity, workflows, time-saving
7. **tutorial**: Step-by-step guides, how-to content
8. **common-mistakes**: Pitfalls, misconceptions, debugging
9. **case-study**: Real-world examples, project breakdowns
10. **deep-dive**: Technical concepts explained deeply

## Topic Status Flow

```
idea → queued → generated → published → archived
```

- **idea**: Initial topic idea (manual or AI-generated)
- **queued**: Marked for brief generation
- **generated**: Brief/carousel sudah di-generate
- **published**: Published to Instagram/TikTok via Buffer
- **archived**: Archived (not used or expired)

## Usage

### Setup

1. Run migration:
```bash
npm run db:migrate-topics
```

2. Access Topic Bank:
```
http://localhost:3000/topics
```

### Generate Weekly Topics

```typescript
// Via UI: Click "Generate Weekly (7 topics)" button

// Via API (external automation only — UI pakai Server Actions):
POST /api/topics/generate
{
  "mode": "weekly",            // "weekly" (7) | "monthly" (28) | "ideas" (count bebas)
  "userId": "user_xxx",
  "startDate": "2026-07-30T00:00:00.000Z",
  "focusArea": "Next.js 16, AI agents",          // optional
  "directives": "cek berita dev terkini dulu",   // optional free-text quality rules
  "research": true                                // optional: web-search grounding pass first
}
```

AI akan generate 7 topics dengan variety:
- Mon: Accessible, broad appeal
- Tue: Tutorial/How-to
- Wed: Common Mistakes
- Thu: Deep-dive technical
- Fri: Tools/Productivity
- Sat: Case Study/Comparison
- Sun: Myth-busting/Concept

### Generate Topic Ideas

```typescript
// Generate 7 topics in specific category
POST /api/topics/generate
{
  "mode": "ideas",
  "userId": "user_xxx",
  "category": "nextjs", // optional
  "count": 7,
  "focusArea": "Next.js 15 new features and migration guides"
}
```

### Manual Topic Entry

```typescript
POST /api/topics
{
  "userId": "user_xxx",
  "title": "JWT Itu Bukan Enkripsi",
  "category": "common-mistakes",
  "description": "Explain perbedaan encoding vs encryption di JWT",
  "keywords": ["jwt", "security", "authentication"],
  "angle": "fokus: Kesalahan Umum",
  "priority": 8
}
```

### Get Topics

```typescript
// Get all topics
GET /api/topics?userId=user_xxx

// Filter by status
GET /api/topics?userId=user_xxx&status=queued

// Filter by category
GET /api/topics?userId=user_xxx&category=nextjs

// Limit results
GET /api/topics?userId=user_xxx&limit=10
```

### Update Topic

```typescript
PATCH /api/topics
{
  "id": "topic_xxx",
  "userId": "user_xxx",
  "status": "queued", // or any field to update
  "scheduledDate": "2026-07-31T12:00:00.000Z"
}
```

### Delete Topic

```typescript
DELETE /api/topics?id=topic_xxx&userId=user_xxx
```

## AI Topic Generation Strategy

### Context Injection

AI receives full Vour brand context:
- Brand positioning: "Building AI workflows, developer tools, automation"
- Target audience: Junior/Mid developers Indonesia
- Content style: Educational carousel, casual Indonesian tone
- Tech stack focus: Next.js ecosystem
- North Star: "Developer yang builds tools yang save people time"

### Topic Quality Criteria

Generated topics must be:
1. **Specific**: Fit dalam 8 slides carousel format
2. **Practical**: Solve real developer problems
3. **Engaging**: Clickable titles untuk TikTok/IG feed
4. **Educational**: Clear learning outcomes
5. **Searchable**: Good keyword coverage
6. **On-brand**: Align dengan Vour positioning

### Example Generated Topics

```json
[
  {
    "title": "3 AI Tools yang Save 5 Jam per Minggu",
    "category": "ai-workflow",
    "description": "Showcase 3 AI tools konkret yang automate repetitive dev tasks. Include use case, setup time, dan ROI calculation.",
    "keywords": ["ai-tools", "productivity", "automation"],
    "angle": "fokus: Panduan Praktis",
    "priority": 9
  },
  {
    "title": "Middleware Next.js: Kapan Pakai vs Jangan Pakai",
    "category": "nextjs",
    "description": "Explain middleware use cases, performance implications, dan common mistakes yang bikin bug production.",
    "keywords": ["nextjs", "middleware", "performance"],
    "angle": "fokus: Best Practices",
    "priority": 8
  }
]
```

## Integration with Carousel Workflow

### Topic → Brief → Carousel

1. **Generate Topic** (via Topic Bank)
   - AI creates topic idea with title, category, description, keywords
   - Status: `idea`

2. **Queue Topic** (manual action)
   - User clicks "Queue for Generation"
   - Status: `idea` → `queued`

3. **Buat Carousel** (trigger dari Topic Bank, atau pilih chip topic di `/create`)
   - Klik "Buat Carousel" → `/create?topic=<id>` → wizard auto-expand topic → brief
     (format brief KANONIK yang sama dengan `lib/ai/prompts.ts` briefSystem)
   - Saat carousel di-export & tersimpan: status `→ generated` + linked `carousel_id`

4. **Publish** (via Buffer integration)
   - Schedule via Buffer dari wizard
   - Status otomatis: `generated` → `published`

### Direct Integration Points

```typescript
// In /create page, load topic:
const topic = await getTopic(topicId, userId);

// Expand to brief:
const brief = await expandTopicToBrief(topic, model);

// Continue with existing workflow:
const plan = await generateSlidePlan(brief, model);
const html = assembleCarousel(plan);
// ... export & publish
```

## Content Calendar View (Future Enhancement)

Weekly calendar view dengan:
- Drag-drop scheduling
- Visual status indicators
- Quick preview of generated briefs
- Batch operations (queue multiple topics)

## Performance Optimizations

1. **Batch Generation**: Generate 7 topics in 1 API call (~30s total)
2. **Caching**: Cache AI-generated topics untuk reuse
3. **Background Jobs**: Queue topic generation via n8n webhook
4. **Index Optimization**: Fast queries by user, status, category

## Daily Workflow Example

### Monday Morning (10 min)
1. Open Topic Bank
2. Click "Generate Weekly (7 topics)"
3. Review AI-generated topics
4. Mark 2-3 favorites as "queued"

### Daily Content Production (20-30 min/day)
1. Open `/create`
2. Select queued topic
3. Click "Generate Brief" → AI expands to full 8-slide outline
4. Review/edit brief
5. Generate slide plan → assemble HTML → export images
6. Schedule to Buffer for 12 PM posting

### Weekly Review (Friday)
- Check published topics performance
- Archive low-priority unused topics
- Generate next week's topics

## Authentication

**UI (browser)** — the Topic Bank page and `/create` wizard call **auth-gated Server Actions**
(`app/topics/actions.ts`); the session cookie is the credential. No API key ever reaches the client.

**External automation (n8n, scripts)** — the `/api/topics/*` REST routes require:
```
x-api-key: <BETTER_AUTH_SECRET>
```

> ⚠️ NEVER set `NEXT_PUBLIC_API_KEY`. `NEXT_PUBLIC_*` vars are compiled into the public
> JS bundle — that would leak `BETTER_AUTH_SECRET` (the session-signing key) to anyone.
> If you previously set it in `.env` or Vercel, delete it and rotate `BETTER_AUTH_SECRET`.

## Error Handling

- **API Key Missing**: 401 Unauthorized
- **Invalid Input**: 400 Bad Request with specific error message
- **AI Generation Failed**: 500 with retry suggestion
- **Database Errors**: Logged server-side, generic error to client

## Future Enhancements

1. **Content Performance Tracking**: Link topics to TikTok/IG analytics
2. **Auto-Queue High Priority**: Auto-queue topics with priority ≥ 8
3. **Trend Integration**: Pull trending hashtags from TikTok/IG API
4. **Competitor Analysis**: Analyze successful content from similar creators
5. **A/B Testing**: Generate 2 angles per topic, test performance
6. **Notion Sync**: Sync topics to Notion content calendar

---

**Built for Vour** | Daily posting workflow for @vourdev carousel content
