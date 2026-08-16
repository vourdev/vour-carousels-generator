"use server";

import { requireSession } from "@/lib/session";
import { availableModels, resolveModel, type ModelId } from "@/lib/ai/registry";
import { generateBrief, generateSlidePlan, reviseSlidePlanScoped, polishBriefVoice } from "@/lib/ai/generate";
import { briefRevisionPrompt, scopedBriefRevisePrompt } from "@/lib/ai/prompts";
import { describeScope, parseRevisionScope, RevisionScopeViolation } from "@/lib/ai/revision-scope";
import { briefScopeViolations, briefTargets, mergeBriefSections, splitBrief } from "@/lib/ai/brief-sections";
import { appendRevision, listRevisions, clearRevisions } from "@/lib/memory/repo";
import { summarizePlanDiff } from "@/lib/memory/diff";
import type { SlidePlan } from "@/lib/ds/schema";
import { assembleCarousel } from "@/lib/ds/assemble";
import { warmUpIllustrations } from "@/lib/ds/illustrations.server";

import { uploadImage } from "@/lib/publish/cloudinary";
import { scheduleBufferPost } from "@/lib/publish/buffer";

async function guardModel(id: ModelId) {
  await requireSession();
  if (!availableModels().includes(id)) throw new Error(`model "${id}" is not configured`);
  return resolveModel(id);
}

export async function listModelsAction(): Promise<ModelId[]> {
  await requireSession();
  return availableModels();
}

export async function briefAction(idea: string, id: ModelId): Promise<string> {
  const model = await guardModel(id);
  return generateBrief(idea, model);
}

export async function humanVoiceEditorAction(brief: string, id: ModelId): Promise<string> {
  const model = await guardModel(id);
  return polishBriefVoice(brief, model);
}

export async function planAction(brief: string, id: ModelId): Promise<SlidePlan> {
  const model = await guardModel(id);
  return generateSlidePlan(brief, model);
}

/**
 * Revise the slide plan, replaying this draft's earlier revisions into the prompt.
 *
 * Without `draftId` the call is stateless, exactly as before — that keeps older
 * saved drafts (which have no draft id) working instead of throwing at Gate 2.
 */
export async function reviseAction(
  plan: SlidePlan,
  message: string,
  id: ModelId,
  draftId?: string
): Promise<SlidePlan> {
  const session = await requireSession();
  const model = await guardModel(id);

  const history = draftId ? await listRevisions(session.user.id, draftId, "plan") : [];

  let result: Awaited<ReturnType<typeof reviseSlidePlanScoped>>;
  try {
    result = await reviseSlidePlanScoped(plan, message, model, history);
  } catch (err) {
    if (err instanceof RevisionScopeViolation) {
      // Blocked, not merged: the caller keeps the plan it already had. Detail goes to the
      // server log because the whole point is that this failure used to be invisible.
      console.error("[revision-guard] blocked a revision that reached outside its scope:", err.violations);
      throw new Error(
        `Revisi dibatalkan: perubahan menyentuh bagian yang tidak diminta (${err.violations.join("; ")}). Rancangan slide dikembalikan ke kondisi sebelumnya.`
      );
    }
    throw err;
  }

  const { plan: revised, scope, changed } = result;

  // A scoped revision that changed nothing in scope is a failed revision. It used to be
  // indistinguishable from a successful one, because the plan was replaced wholesale.
  if (scope.resolved && changed.length === 0) {
    console.warn(`[revision-guard] no-op revision on ${describeScope(scope)}: "${message}"`);
    throw new Error(
      `Revisi tidak menghasilkan perubahan apa pun pada ${describeScope(scope)}. Coba sebutkan lebih spesifik apa yang mau diubah.`
    );
  }

  if (draftId) {
    // Recorded from the actual before/after plans, not from a model self-report.
    await appendRevision({
      userId: session.user.id,
      draftId,
      stage: "plan",
      request: message,
      outcome: `[${describeScope(scope)}] ${summarizePlanDiff(plan, revised)}`,
    });
  }
  return revised;
}

/**
 * Gate-1 counterpart: revise the Markdown brief.
 *
 * Same scoping contract as the plan: when the request names a slide or a deck field, only
 * that `#` section is regenerated and the rest of the document is spliced back verbatim.
 * A request that has no identifiable target still falls through to the whole-brief rewrite.
 */
export async function reviseBriefAction(
  brief: string,
  message: string,
  id: ModelId,
  draftId?: string
): Promise<string> {
  const session = await requireSession();
  const model = await guardModel(id);

  const history = draftId ? await listRevisions(session.user.id, draftId, "brief") : [];
  const sections = splitBrief(brief);
  const slideCount = sections.filter((s) => s.kind === "slide").length;
  const scope = parseRevisionScope(message, slideCount);
  const targets = scope.resolved ? briefTargets(sections, scope) : [];

  let revised: string;
  let outcome: string;

  if (targets.length === 0) {
    revised = await generateBrief(briefRevisionPrompt(brief, message, history), model);
    outcome = `whole brief rewritten (${brief.length} to ${revised.length} chars)`;
  } else {
    const headings = targets.map((i) => sections[i].heading);
    const rewritten = await generateBrief(
      scopedBriefRevisePrompt(brief, headings, message, history),
      model
    );
    const merged = mergeBriefSections(sections, targets, rewritten);

    if (merged.applied.length === 0) {
      console.error("[revision-guard] brief revision returned none of the target sections:", merged.missing);
      throw new Error(
        `Revisi dibatalkan: model tidak mengembalikan bagian yang diminta (${headings.join(", ")}). Brief dikembalikan ke kondisi sebelumnya.`
      );
    }

    const violations = briefScopeViolations(sections, merged.brief, merged.applied);
    if (violations.length) {
      console.error("[revision-guard] brief revision reached outside its scope:", violations);
      throw new Error(
        `Revisi dibatalkan: perubahan menyentuh bagian yang tidak diminta (${violations.join("; ")}). Brief dikembalikan ke kondisi sebelumnya.`
      );
    }

    revised = merged.brief;
    outcome = `${merged.applied.map((i) => sections[i].heading).join(", ")} rewritten`;
    if (merged.missing.length) outcome += ` (not returned: ${merged.missing.join(", ")})`;
  }

  if (draftId) {
    await appendRevision({
      userId: session.user.id,
      draftId,
      stage: "brief",
      request: message,
      outcome,
    });
  }
  return revised;
}

/**
 * Drop a draft's revision memory. Called once the draft leaves the editor for
 * good: scheduled to Buffer, saved to stock, or discarded on reset. There is
 * nothing left to revise, so keeping the log would only leak into a later draft
 * that happened to reuse the id.
 */
export async function clearRevisionMemoryAction(draftId: string): Promise<void> {
  const session = await requireSession();
  await clearRevisions(session.user.id, draftId);
}

export async function getPublishingConfigAction(): Promise<{ hasIg: boolean; hasTt: boolean }> {
  await requireSession();
  return {
    hasIg: Boolean(process.env.BUFFER_IG_CHANNEL_ID),
    hasTt: Boolean(process.env.BUFFER_TIKTOK_CHANNEL_ID),
  };
}

/**
 * Assemble the preview/export HTML for a plan.
 *
 * This runs on the server on purpose. assembleCarousel pulls in render-slide, which reads
 * the ~1.5 MB of unDraw SVGs off disk; calling it from the client component put that whole
 * payload into the browser bundle (a single 2.7 MB chunk). Now only the assembled HTML for
 * the deck at hand crosses the wire, and only when the plan actually changes.
 */
export async function assembleAction(plan: SlidePlan): Promise<string> {
  await requireSession();
  await warmUpIllustrations();
  return assembleCarousel(plan);
}

export async function uploadSingleImageAction(base64Image: string): Promise<string> {
  await requireSession();
  return await uploadImage(base64Image);
}

export async function publishAction(
  urls: string[],
  plan: SlidePlan,
  dueAt: string
): Promise<{ igPostId?: string; ttPostId?: string }> {
  await requireSession();

  const igChannelId = process.env.BUFFER_IG_CHANNEL_ID;
  const ttChannelId = process.env.BUFFER_TIKTOK_CHANNEL_ID;

  if (!igChannelId && !ttChannelId) {
    throw new Error("Neither BUFFER_IG_CHANNEL_ID nor BUFFER_TIKTOK_CHANNEL_ID is configured in the environment");
  }

  const hashtagsStr = plan.hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");
  const text = plan.caption ? `${plan.caption}\n\n${hashtagsStr}` : hashtagsStr;

  const results: { igPostId?: string; ttPostId?: string } = {};

  if (igChannelId) {
    results.igPostId = await scheduleBufferPost({
      channelId: igChannelId,
      text,
      assets: urls,
      dueAt,
    });
  }

  if (ttChannelId) {
    results.ttPostId = await scheduleBufferPost({
      channelId: ttChannelId,
      text,
      assets: urls,
      dueAt,
      isTikTok: true,
      title: plan.title,
    });
  }

  return results;
}

