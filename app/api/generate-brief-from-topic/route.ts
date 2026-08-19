import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getTopic } from "@/lib/topics/bank";

export async function POST(req: Request) {
  const { user } = await requireSession();
  const { topicId, modelId } = (await req.json()) as { topicId: string; modelId: string };

  if (!topicId) {
    return NextResponse.json({ error: "Missing topicId" }, { status: 400 });
  }

  const topic = await getTopic(topicId, user.id);
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const idea = [
    `Topik: ${topic.title}`,
    `Kategori: ${topic.category}`,
    topic.description ? `Deskripsi: ${topic.description}` : "",
    topic.angle ? `Angle: ${topic.angle}` : "",
    topic.keywords?.length ? `Keywords: ${topic.keywords.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Call the Hono backend API /api/brief
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:3000";
  try {
    const forwardHeaders = new Headers();
    forwardHeaders.set("Content-Type", "application/json");
    const cookie = req.headers.get("cookie");
    if (cookie) forwardHeaders.set("cookie", cookie);
    const auth = req.headers.get("authorization");
    if (auth) forwardHeaders.set("authorization", auth);

    const res = await fetch(`${backendUrl}/api/brief`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify({ idea, modelId }),
    });

    if (!res.ok) {
      const errObj = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errObj.error || `Backend returned error ${res.status}: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ brief: data.brief });
  } catch (err: any) {
    console.error("Failed to expand topic to brief on backend:", err);
    return NextResponse.json({ error: `Backend expand failed: ${err.message}` }, { status: 500 });
  }
}
