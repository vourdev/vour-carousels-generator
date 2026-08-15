import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { resolveModel, type ModelId } from "@/lib/ai/registry";
import { generateSlidePlan, reviseSlidePlanScoped } from "@/lib/ai/generate";
import { describeScope, RevisionScopeViolation } from "@/lib/ai/revision-scope";
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
    // Same scoping, merge and guard contract as reviseAction — this route is a second
    // door into the same operation, so it must not be the one that skips the guard.
    const history = body.draftId
      ? await listRevisions(session.user.id, body.draftId, "plan")
      : [];

    let revised;
    try {
      revised = await reviseSlidePlanScoped(body.plan, body.message, model, history);
    } catch (err) {
      if (err instanceof RevisionScopeViolation) {
        console.error("[revision-guard] blocked an out-of-scope revision:", err.violations);
        return NextResponse.json(
          { error: "Revision touched fields outside its scope; the plan was not changed.", violations: err.violations },
          { status: 422 }
        );
      }
      throw err;
    }

    const { plan, scope, changed } = revised;
    if (scope.resolved && changed.length === 0) {
      return NextResponse.json(
        { error: `Revision changed nothing in ${describeScope(scope)}.`, scope: describeScope(scope) },
        { status: 422 }
      );
    }

    if (body.draftId) {
      await appendRevision({
        userId: session.user.id,
        draftId: body.draftId,
        stage: "plan",
        request: body.message,
        outcome: `[${describeScope(scope)}] ${summarizePlanDiff(body.plan, plan)}`,
      });
    }
    return NextResponse.json({ plan, scope: describeScope(scope), changed });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
