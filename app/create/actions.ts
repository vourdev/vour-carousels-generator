"use server";

import { requireSession } from "@/lib/session";
import { availableModels, resolveModel, type ModelId } from "@/lib/ai/registry";
import { generateBrief, generateSlidePlan, reviseSlidePlan } from "@/lib/ai/generate";
import type { SlidePlan } from "@/lib/ds/schema";

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

export async function planAction(brief: string, id: ModelId): Promise<SlidePlan> {
  const model = await guardModel(id);
  return generateSlidePlan(brief, model);
}

export async function reviseAction(plan: SlidePlan, message: string, id: ModelId): Promise<SlidePlan> {
  const model = await guardModel(id);
  return reviseSlidePlan(plan, message, model);
}

export async function getPublishingConfigAction(): Promise<{ hasIg: boolean; hasTt: boolean }> {
  await requireSession();
  return {
    hasIg: Boolean(process.env.BUFFER_IG_CHANNEL_ID),
    hasTt: Boolean(process.env.BUFFER_TIKTOK_CHANNEL_ID),
  };
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

