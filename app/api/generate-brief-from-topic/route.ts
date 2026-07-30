import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { resolveModel, type ModelId } from "@/lib/ai/registry";
import { getTopic } from "@/lib/topics/bank";
import { expandTopicToBrief } from "@/lib/topics/generator";

export async function POST(req: Request) {
  const { user } = await requireSession();
  const { topicId, modelId } = (await req.json()) as { topicId: string; modelId: ModelId };

  if (!topicId) {
    return NextResponse.json({ error: "Missing topicId" }, { status: 400 });
  }

  const topic = await getTopic(topicId, user.id);
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const model = resolveModel(modelId);
  const brief = await expandTopicToBrief(topic, model);
  return NextResponse.json({ brief });
}
