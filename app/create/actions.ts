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

export interface CaptureResult {
  /** base64 JPEGs, for the local "download all" without a round trip. */
  images: string[];
  /** Permanent Cloudinary URLs, uploaded by the backend as part of the capture. */
  urls: string[];
  /** Set when the upload failed; `urls` is empty and the deck has to be uploaded at publish time. */
  uploadError?: string;
}

/**
 * Render the deck to images, which now come back with somewhere to live.
 *
 * The URLs are the point. Capture is the most expensive step in the pipeline, and its
 * output used to exist only as object URLs in this tab — so a refresh lost them and the
 * wizard re-ran the whole capture. Passing `carouselId` also writes them onto the row.
 */
export async function captureAction(html: string, carouselId?: string): Promise<CaptureResult> {
  const data = await fetchBackend("/api/capture", { html, carouselId });
  return { images: data.images ?? [], urls: data.urls ?? [], uploadError: data.uploadError };
}

/** The exported slides of a saved carousel — what a refreshed wizard reads to skip re-capture. */
export async function getCarouselAction(id: string): Promise<{
  id: string;
  status: string;
  imageUrls: string[];
  title: string;
  caption: string;
} | null> {
  await requireSession();
  try {
    const data = await fetchBackend(`/api/carousels/${id}`, null, "GET");
    return data.carousel ?? null;
  } catch {
    // A draft deleted on another device, or a row from before this column existed.
    // The wizard falls back to its local copy rather than surfacing an error.
    return null;
  }
}

export async function publishAction(
  urls: string[],
  plan: SlidePlan,
  dueAt: string
): Promise<{ igPostId?: string; ttPostId?: string }> {
  return await fetchBackend("/api/publish/schedule", { urls, plan, dueAt });
}
