import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { defaultModel, resolveModel } from "@/lib/ai/registry";
import { generateBrief, generateSlidePlan } from "@/lib/ai/generate";
import { assembleCarousel } from "@/lib/ds/assemble";
import { warmUpIllustrations } from "@/lib/ds/illustrations.server";
import { captureCarouselServer } from "@/lib/export/capture-server";
import { uploadImage } from "@/lib/publish/cloudinary";
import { scheduleBufferPost } from "@/lib/publish/buffer";
import { createCarousel, updateCarousel } from "@/lib/history/repo";

export const maxDuration = 60; // Extend Vercel / Next.js function timeout to 60s

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local-auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

interface GenerateRequest {
  topic?: string;
  title?: string;
}

async function createAndPublishCarousel({
  topic,
  angleInstruction,
  dueAt,
  userId,
  modelId,
  resolvedModel,
  channels,
}: {
  topic: string;
  angleInstruction: string;
  dueAt: string;
  userId: string;
  modelId: string;
  resolvedModel: any;
  channels: { igChannelId?: string; ttChannelId?: string };
}) {
  const ideaWithAngle = `${topic}${angleInstruction}`;
  
  // 1. Generate Brief Outline via AI
  const brief = await generateBrief(ideaWithAngle, resolvedModel);
  
  // 2. Generate Slide Plan (JSON) via AI
  const plan = await generateSlidePlan(brief, resolvedModel);
  
  // 3. Assemble Carousel HTML
  await warmUpIllustrations();
  const html = assembleCarousel(plan);
  
  // 4. Capture Carousel slides to Buffer JPEGs using Playwright (deviceScaleFactor = 2 for HD)
  const imageBuffers = await captureCarouselServer(html, { pixelRatio: 2 });
  
  // 5. Upload screenshots to Cloudinary
  const imageUrls: string[] = [];
  for (const buffer of imageBuffers) {
    const base64 = buffer.toString("base64");
    const secureUrl = await uploadImage(base64);
    imageUrls.push(secureUrl);
  }
  
  // 6. Save initial Carousel draft to Database
  const dbItem = await createCarousel({
    userId,
    source: "ai",
    title: plan.title,
    caption: plan.caption,
    hashtags: plan.hashtags,
    slideCount: plan.slides.length,
    model: modelId,
    status: "scheduled",
    thumbnail: imageUrls[0] || null,
    imageUrls,
  });
  
  // 7. Publish to Buffer channels
  const hashtagsStr = plan.hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");
  const text = plan.caption ? `${plan.caption}\n\n${hashtagsStr}` : hashtagsStr;
  
  let igPostId: string | undefined;
  let ttPostId: string | undefined;
  
  if (channels.igChannelId) {
    igPostId = await scheduleBufferPost({
      channelId: channels.igChannelId,
      text,
      assets: imageUrls,
      dueAt,
    });
  }
  
  if (channels.ttChannelId) {
    ttPostId = await scheduleBufferPost({
      channelId: channels.ttChannelId,
      text,
      assets: imageUrls,
      dueAt,
      isTikTok: true,
      title: plan.title,
    });
  }
  
  // 8. Update database record with Buffer post IDs
  await updateCarousel(dbItem.id, {
    status: "scheduled",
    bufferIgId: igPostId || null,
    bufferTtId: ttPostId || null,
    dueAt,
  });
  
  return {
    id: dbItem.id,
    title: plan.title,
    dueAt,
    imageCount: imageUrls.length,
    igPostId,
    ttPostId,
  };
}

export async function POST(req: Request) {
  // 1. Authenticate with x-api-key matching BETTER_AUTH_SECRET
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse request body for topic
  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = body.topic || body.title;
  if (!topic || !topic.trim()) {
    return NextResponse.json({ error: "Missing topic or title in request body" }, { status: 400 });
  }

  // 3. Resolve user ID (fallback to the first registered user)
  let userId: string | null = null;
  try {
    const userRes = await client.execute("SELECT id FROM user LIMIT 1");
    userId = userRes.rows[0]?.id as string | null;
  } catch (err: any) {
    return NextResponse.json({ error: `Database user lookup failed: ${err.message}` }, { status: 500 });
  }

  if (!userId) {
    return NextResponse.json({ error: "No user found in the database. Seed the database first." }, { status: 500 });
  }

  // 4. Resolve default configured AI model
  const modelId = defaultModel();
  if (!modelId) {
    return NextResponse.json({ error: "No AI model API keys configured in .env" }, { status: 500 });
  }
  const resolvedModel = resolveModel(modelId);

  // 5. Setup publishing channels
  const igChannelId = process.env.BUFFER_IG_CHANNEL_ID;
  const ttChannelId = process.env.BUFFER_TIKTOK_CHANNEL_ID;
  if (!igChannelId && !ttChannelId) {
    return NextResponse.json({ error: "No active Buffer channels configured in .env" }, { status: 500 });
  }
  const channels = { igChannelId, ttChannelId };

  // 6. Calculate schedule times: 12:00 PM (noon) today. Stagger the second one by 30 mins (12:30 PM).
  const now = new Date();
  let due1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  if (due1.getTime() <= now.getTime()) {
    // If it's already past 12 PM, schedule for tomorrow 12 PM
    due1.setDate(due1.getDate() + 1);
  }
  const due2 = new Date(due1.getTime() + 30 * 60 * 1000); // +30 minutes stagger

  const dueAt1 = due1.toISOString();
  const dueAt2 = due2.toISOString();

  // 7. Generate and Publish 2 Carousels in parallel
  try {
    const [carousel1, carousel2] = await Promise.all([
      createAndPublishCarousel({
        topic,
        angleInstruction: " (fokus: Panduan Praktis, Tips & Tutorial)",
        dueAt: dueAt1,
        userId,
        modelId,
        resolvedModel,
        channels,
      }),
      createAndPublishCarousel({
        topic,
        angleInstruction: " (fokus: Kesalahan Umum, Mitos, Studi Kasus & Konsep Mendalam)",
        dueAt: dueAt2,
        userId,
        modelId,
        resolvedModel,
        channels,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Successfully generated and scheduled 2 carousels to Buffer",
      carousels: [carousel1, carousel2],
    });
  } catch (err: any) {
    console.error("Batch carousel generation failed:", err);
    return NextResponse.json({ error: `Automation failed: ${err.message}` }, { status: 500 });
  }
}
