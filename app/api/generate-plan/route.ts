import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { resolveModel, type ModelId } from "@/lib/ai/registry";
import { generateSlidePlan, reviseSlidePlan } from "@/lib/ai/generate";
import { appendRevision, listRevisions } from "@/lib/memory/repo";
import { summarizePlanDiff } from "@/lib/memory/diff";
import type { SlidePlan } from "@/lib/ds/schema";

export async function POST(req: Request) {
  const session = await requireSession();

  const body = (await req.json()) as
    | { type: "plan"; brief: string; modelId: ModelId }
    | { type: "revise"; plan: SlidePlan; message: string; modelId: ModelId; draftId?: string };

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
    // Same replay-and-record contract as reviseAction; draftId is optional so an
    // older client that does not send one still gets a stateless revision.
    const history = body.draftId
      ? await listRevisions(session.user.id, body.draftId, "plan")
      : [];
    const plan = await reviseSlidePlan(body.plan, body.message, model, history);
    if (body.draftId) {
      await appendRevision({
        userId: session.user.id,
        draftId: body.draftId,
        stage: "plan",
        request: body.message,
        outcome: summarizePlanDiff(body.plan, plan),
      });
    }
    return NextResponse.json({ plan });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
