import { NextResponse } from "next/server";
import { getTopics, getTopic, updateTopic, deleteTopic, createTopic } from "@/lib/topics/bank";
import type { TopicCategory, TopicStatus } from "@/lib/topics/bank";

export async function GET(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const topicId = searchParams.get("id");
  const status = searchParams.get("status") as TopicStatus | undefined;
  const category = searchParams.get("category") as TopicCategory | undefined;
  const limit = searchParams.get("limit");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    if (topicId) {
      const topic = await getTopic(topicId, userId);
      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 });
      }
      return NextResponse.json({ topic });
    }

    const topics = await getTopics(userId, {
      status,
      category,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ topics, count: topics.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch topics:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, title, category, description, keywords, angle, priority, scheduledDate } = body;

    if (!userId || !title || !category) {
      return NextResponse.json(
        { error: "Missing required fields: userId, title, category" },
        { status: 400 }
      );
    }

    const topic = await createTopic({
      userId,
      title,
      category,
      description,
      keywords,
      angle,
      priority,
      scheduledDate,
    });

    return NextResponse.json({ success: true, topic });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to create topic:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, userId, ...updates } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 });
    }

    await updateTopic(id, userId, updates);
    const updated = await getTopic(id, userId);

    return NextResponse.json({ success: true, topic: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to update topic:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("userId");

  if (!id || !userId) {
    return NextResponse.json({ error: "Missing id or userId" }, { status: 400 });
  }

  try {
    await deleteTopic(id, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to delete topic:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
