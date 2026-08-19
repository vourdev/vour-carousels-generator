"use server";

import type { ModelId } from "@/lib/models";
import type { SlidePlan } from "@/lib/ds/schema";
import { clearRevisions } from "@/lib/memory/repo";
import { requireSession } from "@/lib/session";
import { backendGet, backendSend } from "@/lib/backend";

/** Kept so the call sites below read unchanged; the transport lives in lib/backend. */
function fetchBackend(path: string, bodyObj: any, method: string = "POST") {
  return method === "GET" ? backendGet(path) : backendSend(path, bodyObj, method as "POST");
}

export async function listModelsAction(): Promise<ModelId[]> {
  await requireSession();
  const data = await fetchBackend("/api/models", null, "GET");
  return data.models;
}

export async function briefAction(idea: string, id: ModelId): Promise<string> {
  const data = await fetchBackend("/api/brief", { idea, modelId: id });
  return data.brief;
}

export async function humanVoiceEditorAction(brief: string, id: ModelId): Promise<string> {
  const data = await fetchBackend("/api/brief/polish", { brief, modelId: id });
  return data.brief;
}

export async function planAction(brief: string, id: ModelId): Promise<SlidePlan> {
  const data = await fetchBackend("/api/plan", { brief, modelId: id });
  return data.plan;
}

export async function reviseAction(
  plan: SlidePlan,
  message: string,
  id: ModelId,
  draftId?: string
): Promise<SlidePlan> {
  const data = await fetchBackend("/api/plan/revise", {
    plan,
    message,
    modelId: id,
    draftId,
  });
  return data.plan;
}

export async function reviseBriefAction(
  brief: string,
  message: string,
  id: ModelId,
  draftId?: string
): Promise<string> {
  const data = await fetchBackend("/api/brief/revise", {
    brief,
    message,
    modelId: id,
    draftId,
  });
  return data.brief;
}

export async function clearRevisionMemoryAction(draftId: string): Promise<void> {
  const session = await requireSession();
  await clearRevisions(session.user.id, draftId);
}

export async function getPublishingConfigAction(): Promise<{ hasIg: boolean; hasTt: boolean }> {
  await requireSession();
  return await fetchBackend("/api/publish/config", null, "GET");
}

export async function assembleAction(plan: SlidePlan): Promise<string> {
  const data = await fetchBackend("/api/assemble", { plan });
  return data.html;
}

export async function uploadSingleImageAction(base64Image: string): Promise<string> {
  const data = await fetchBackend("/api/publish/upload", { image: base64Image });
  return data.url;
}

export async function captureAction(html: string): Promise<string[]> {
  const data = await fetchBackend("/api/capture", { html });
  return data.images;
}

export async function publishAction(
  urls: string[],
  plan: SlidePlan,
  dueAt: string
): Promise<{ igPostId?: string; ttPostId?: string }> {
  return await fetchBackend("/api/publish/schedule", { urls, plan, dueAt });
}
