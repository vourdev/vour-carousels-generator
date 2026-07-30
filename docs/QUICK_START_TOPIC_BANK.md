# Quick Start: Topic Bank & Daily Content Workflow

## Setup (5 menit)

1. **Run migration**
```bash
cd /Users/zero/Projects/vour-carousels
npm run db:migrate-topics
```

2. **Set API key** (jika belum ada)
Add ke `.env`:
```env
# (tidak perlu API key — UI pakai session login)
```

3. **Start dev server**
```bash
npm run dev
```

4. **Access Topic Bank**
```
http://localhost:3000/topics
```

## Daily Workflow (20-30 menit per konten)

### Monday: Generate Weekly Topics (10 menit)

1. Buka `/topics`
2. Klik **"Generate Weekly (7 topics)"**
3. AI akan generate 7 topics untuk Mon-Sun dengan variety:
   - Tutorial/How-to
   - Common Mistakes
   - Deep-dive
   - Tools/Productivity
   - Comparisons
   - Myth-busting

4. Review topics, mark favorit sebagai **"Queue for Generation"**

### Daily: Create Content (20-30 menit)

1. **Pilih Topic** dari Topic Bank (status: queued)
   
2. **Generate Brief** 
   - Klik "Generate Brief" → redirect ke `/create?topic=xxx`
   - AI expand topic → full 8-slide carousel brief
   - Review & edit jika perlu

3. **Generate Carousel**
   - Klik "Generate Slides" → AI create slide plan
   - Preview HTML carousel
   - Edit copy jika perlu

4. **Export & Schedule**
   - Klik "Export Images" → download 8 JPEGs
   - Klik "Schedule to Buffer"
   - Set waktu publish (default: 12 PM)
   - Done! ✅

### Friday: Review & Plan

- Check published carousel performance
- Archive unused topics
- Generate topics untuk next week

## AI Generation Examples

### Input: Click "Generate Weekly"

### Output: 7 Topics

```
Mon: "3 AI Tools yang Save 5 Jam per Minggu" (ai-workflow)
Tue: "Setup Prisma di Next.js: Step-by-Step Guide" (tutorial)
Wed: "5 Kesalahan Fatal di Next.js Middleware" (common-mistakes)
Thu: "React Server Components: Deep Dive" (deep-dive)
Fri: "VSCode Extensions untuk Productivity 2x Lipat" (productivity)
Sat: "Next.js vs Nuxt: Kapan Pakai Apa?" (case-study)
Sun: "TypeScript 'any' Bukan Musuh Developer" (deep-dive)
```

## Manual Topic Entry

Untuk specific topics yang mau kamu explore:

1. Klik **"Add Manual"**
2. Fill form:
   - **Title**: "Docker Compose untuk Dev Environment"
   - **Category**: tutorial
   - **Description**: "Setup Docker Compose untuk Next.js + PostgreSQL local dev"
   - **Keywords**: docker, compose, nextjs, postgresql
   - **Angle**: fokus: Panduan Praktis

3. Save → topic masuk bank dengan status `idea`
4. Mark as **"Queue for Generation"** kapan siap dibuat

## Batch Generation (Advanced)

Generate banyak ideas sekaligus:

```bash
curl -X POST http://localhost:3000/api/topics/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret" \
  -d '{
    "mode": "ideas",
    "userId": "user_xxx",
    "category": "nextjs",
    "count": 10,
    "focusArea": "Next.js 15 new features and migration patterns"
  }'
```

## Integration with Buffer

Topics → Brief → Carousel → Buffer schedule (automated)

**Flow**:
1. Topic queued
2. Generate brief (via `/create`)
3. Generate carousel HTML
4. Export images (8 JPEGs, 1080×1350)
5. Auto-upload to Cloudinary
6. Schedule to Buffer (IG + TikTok channels)
7. Topic status → `published`
8. Buffer auto-post at scheduled time

**Scheduling Strategy**:
- Default: 12:00 PM daily
- Stagger multiple posts: +30 min each
- Weekend posts: adjust for audience activity

## Tips untuk Consistency (7x/week)

1. **Batch Generate Topics**: Generate full week di hari Senin
2. **Queue Priority Topics**: Mark high-priority topics untuk next 3 days
3. **Time Block**: Dedicate 30 min same time every day (e.g., 10 AM)
4. **Use Templates**: For similar topics (e.g., "X Common Mistakes in Y")
5. **Repurpose Content**: Best-performing topics → ebook chapters

## Troubleshooting

### AI Generation Failed
- Check API keys: `GOOGLE_GENERATIVE_AI_API_KEY` atau `OMNIROUTE_API_KEY`
- Check model config: `OMNIROUTE_COMBO` set?
- Retry: API calls auto-retry 3x with backoff

### Topics Not Saving
- Run migration: `npm run db:migrate-topics`
- Check database: `DATABASE_URL` configured?
- Check user exists: `npm run db:seed`

### Can't Access Topic Bank
- Check auth: logged in?
- Check route: `/topics` page exists?
- Pastikan sudah login (UI pakai session, bukan API key)

## Metrics to Track

**Weekly Goals**:
- ✅ 7 topics generated Monday
- ✅ 7 carousels published (Mon-Sun)
- ✅ Topics categorized (80% technical, 20% productivity)
- ✅ Average engagement per post

**Monthly Goals**:
- 30 topics published
- 10+ high-performing topics (save/share rate >5%)
- 3-5 topics → ebook chapter ideas
- Audience growth: target +10% followers/month

---

**Pro Tip**: Generate 2 weeks worth of topics, queue top 10, execute best 7. Buffer ensures you always have backup content ideas.
