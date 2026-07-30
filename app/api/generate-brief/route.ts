import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { resolveModel, type ModelId } from "@/lib/ai/registry";
import { generateBrief } from "@/lib/ai/generate";

export async function POST(req: Request) {
  await requireSession();

  const { idea, modelId } = (await req.json()) as { idea: string; modelId: ModelId };
  if (!idea?.trim()) {
    return NextResponse.json({ error: "Missing idea" }, { status: 400 });
  }

  const model = resolveModel(modelId);
  const brief = await generateBrief(idea, model);
  return NextResponse.json({ brief });
}
