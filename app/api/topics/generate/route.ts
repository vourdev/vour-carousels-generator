import { NextResponse } from "next/server";
import { defaultModel, resolveModel } from "@/lib/ai/registry";
import { generateAndSaveTopics } from "@/lib/topics/service";
import type { TopicCategory } from "@/lib/topics/bank";
import type { PlanMode } from "@/lib/topics/schedule";

// Research pass (web grounding) + up to a month of topics in one batch.
export const maxDuration = 300;

interface GenerateTopicsRequest {
  mode: PlanMode;
  category?: TopicCategory;
  count?: number;
  focusArea?: string;
  directives?: string;
  research?: boolean;
  startDate?: string;
  /** deprecated alias of startDate (older n8n workflows) */
  weekStartDate?: string;
  userId: string;
}

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateTopicsRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (!["ideas", "weekly", "monthly"].includes(body.mode)) {
    return NextResponse.json(
      { error: `Invalid mode "${body.mode}" — use ideas | weekly | monthly` },
      { status: 400 }
    );
  }

  const modelId = defaultModel();
  if (!modelId) {
    return NextResponse.json({ error: "No AI model configured" }, { status: 500 });
  }

  try {
    const topics = await generateAndSaveTopics(body.userId, resolveModel(modelId), {
      mode: body.mode,
      count: body.count,
      category: body.category,
      focusArea: body.focusArea,
      directives: body.directives,
      research: body.research,
      startDate: body.startDate ?? body.weekStartDate,
    });

    return NextResponse.json({ success: true, topics, count: topics.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Topic generation failed:", err);
    return NextResponse.json(
      { error: `Failed to generate topics: ${message}` },
      { status: 500 }
    );
  }
}
