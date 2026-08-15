"use server";

import { requireSession } from "@/lib/session";
import { availableModels, resolveModel, type ModelId } from "@/lib/ai/registry";
import { generateBrief, generateSlidePlan, reviseSlidePlan, polishBriefVoice } from "@/lib/ai/generate";
import { briefRevisionPrompt } from "@/lib/ai/prompts";
import { appendRevision, listRevisions, clearRevisions } from "@/lib/memory/repo";
import { summarizePlanDiff } from "@/lib/memory/diff";
import type { SlidePlan } from "@/lib/ds/schema";
import { assembleCarousel } from "@/lib/ds/assemble";

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
  const revised = await reviseSlidePlan(plan, message, model, history);

  if (draftId) {
    // Recorded from the actual before/after plans, not from a model self-report.
    await appendRevision({
      userId: session.user.id,
      draftId,
      stage: "plan",
      request: message,
      outcome: summarizePlanDiff(plan, revised),
    });
  }
  return revised;
}

/** Gate-1 counterpart: revise the Markdown brief with the same replayed memory. */
export async function reviseBriefAction(
  brief: string,
  message: string,
  id: ModelId,
  draftId?: string
): Promise<string> {
  const session = await requireSession();
  const model = await guardModel(id);

  const history = draftId ? await listRevisions(session.user.id, draftId, "brief") : [];
  const revised = await generateBrief(briefRevisionPrompt(brief, message, history), model);

  if (draftId) {
    await appendRevision({
      userId: session.user.id,
      draftId,
      stage: "brief",
      request: message,
      outcome: `brief rewritten (${brief.length} to ${revised.length} chars)`,
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

