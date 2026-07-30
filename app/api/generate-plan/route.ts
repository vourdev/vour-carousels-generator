import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { resolveModel, type ModelId } from "@/lib/ai/registry";
import { generateSlidePlan, reviseSlidePlan } from "@/lib/ai/generate";
import type { SlidePlan } from "@/lib/ds/schema";

export async function POST(req: Request) {
  await requireSession();

  const body = (await req.json()) as
    | { type: "plan"; brief: string; modelId: ModelId }
    | { type: "revise"; plan: SlidePlan; message: string; modelId: ModelId };

  if (body.type === "plan") {
    if (!body.brief?.trim()) {
      return NextResponse.json({ error: "Missing brief" }, { status: 400 });
    }
    const model = resolveModel(body.modelId);
    const plan = await generateSlidePlan(body.brief, model);
    return NextResponse.json({ plan });
  }

  if (body.type === "revise") {
    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }
    const model = resolveModel(body.modelId);
    const plan = await reviseSlidePlan(body.plan, body.message, model);
    return NextResponse.json({ plan });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
