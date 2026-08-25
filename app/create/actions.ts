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

/**
 * One automatic screenshot-evidence attempt the backend made while planning.
 *
 * `outcome` is anything but "captured" when the slide still needs a human: the site could
 * not be resolved from a web search, the page would not load, or the picture failed the
 * automated quality check. `slideIndex` is which slide to put the upload form on.
 */
export interface EvidenceAttempt {
  slideIndex?: number;
  entity: string;
  host?: string;
  url?: string;
  outcome: "captured" | "skipped" | "rejected" | "error";
  reason?: string;
}

export interface PlanResult {
  plan: SlidePlan;
  /** Absent for a deck with no screenshot slide, which is most of them. */
  evidence: EvidenceAttempt[];
}

export async function planAction(brief: string, id: ModelId): Promise<PlanResult> {
  const data = await fetchBackend("/api/plan", { brief, modelId: id });
  return { plan: data.plan, evidence: data.evidence ?? [] };
}

export interface EvidenceUpload {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
  /** The picture looks blank or flat. Advice only — the person chose this file. */
  warning?: "mostly-blank" | "flat-overlay";
}

/**
 * Hand an uploaded screenshot to the backend to be cropped, capped and re-encoded.
 *
 * The crop used to run in the browser here, and it had drifted from the backend's:
 * centre-anchored at 1080px and quality 0.8 against top-anchored at 2048 and 0.9, so a
 * slide looked different depending on whether a person or the automatic capture filled
 * it. There is one implementation now, and it is not in this app.
 */
export async function evidenceUploadAction(input: {
  dataUrl: string;
  cropRatio?: string;
  slideIndex?: number;
  source?: string;
}): Promise<EvidenceUpload> {
  return await fetchBackend("/api/evidence/upload", input);
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
  /** Permanent Cloudinary URLs, uploaded by the backend as part of the capture. */
  urls: string[];
  /**
   * base64 JPEGs — the fallback payload, non-empty only when the upload failed.
   *
   * Returning both would push ~2.4 MB of base64 through a Server Action on every
   * export. Next rejects it outright ("Maximum array nesting exceeded"), and it was
   * pure waste even when it fit: the client turned it into blobs and dropped them on
   * the next reload. With URLs in hand nothing reads this.
   */
  images: string[];
  /** Set when the upload failed; `urls` is empty and the deck is uploaded at publish time. */
  uploadError?: string;
}

/**
 * Render the deck to images, which now come back with somewhere to live.
 *
 * The URLs are the point. Capture is the most expensive step in the pipeline, and its
 * output used to exist only as object URLs in this tab — so a refresh lost them and the
 * wizard re-ran the whole capture. Passing `carouselId` also writes them onto the row.
 *
 * The plan goes over, not the assembled HTML. A deck is ~1.1 MB of inline fonts and SVG
 * that the backend produced in the first place; posting it back to be captured meant it
 * crossed the wire twice per export, and Next refuses to encode a string that size as a
 * Server Action argument at all ("Maximum array nesting exceeded").
 *
 * Capture is a job now, not a response. It used to render, upload and reply on one
 * connection; that connection lived as long as the work did — 269 seconds for a
 * five-slide deck, because more than half the Cloudinary uploads fail on the first
 * attempt against this VPS's uplink — and Cloudflare closes an origin connection at 100
 * seconds. The browser got `Backend returned error 524` while the slides were already
 * on Cloudinary. Starting the job and polling it keeps every request short.
 */
export async function startCaptureAction(plan: SlidePlan, carouselId?: string): Promise<string> {
  const data = await fetchBackend("/api/capture", { plan, carouselId });
  if (!data.jobId) throw new Error("Backend did not start a capture job.");
  return data.jobId;
}

export type CaptureStatus =
  | { status: "pending" }
  | ({ status: "done" } & CaptureResult)
  | { status: "error"; error: string }
  /** Swept, or the backend restarted under the job. The caller should export again. */
  | { status: "unknown" };

export async function pollCaptureAction(jobId: string): Promise<CaptureStatus> {
  await requireSession();
  try {
    const data = await fetchBackend(`/api/capture/${jobId}`, null, "GET");
    if (data.status === "done") {
      return {
        status: "done",
        images: data.images ?? [],
        urls: data.urls ?? [],
        uploadError: data.uploadError,
      };
    }
    if (data.status === "error") return { status: "error", error: data.error ?? "capture failed" };
    return { status: "pending" };
  } catch {
    // backendFetch throws on any non-2xx, and the only one this endpoint returns is the
    // 404 for a job it no longer knows about.
    return { status: "unknown" };
  }
}

/**
 * Capture straight to base64, for callers that only want to download the JPEGs.
 *
 * This one has no draft and no carousel row to poll against from the client, so it waits
 * here. The bound matters: without it this would be exactly the long-lived request the
 * job queue exists to avoid, and it would fail the same way.
 */
export async function captureHtmlAction(html: string): Promise<string[]> {
  await requireSession();
  const { jobId } = await fetchBackend("/api/capture", { html });
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const s = await pollCaptureAction(jobId);
    if (s.status === "done") return s.images;
    if (s.status === "error") throw new Error(s.error);
    if (s.status === "unknown") throw new Error("Capture job is no longer available.");
  }
  throw new Error("Capture took too long; try exporting from the wizard instead.");
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
