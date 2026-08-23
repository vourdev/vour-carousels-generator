import type { SlidePlan } from "@/lib/ds/schema";
import type { Message } from "./_components/chat-feed";
import type { ArtifactTab } from "./_components/artifact-panel";
import type { MdMode } from "./_components/brief-editor";

/**
 * One definition of what a draft is.
 *
 * The wizard keeps these as separate `useState` calls, which is fine until something has
 * to touch all of them at once — restore from localStorage, autosave, reset. Those three
 * each had their own hand-written list of fields, and the lists had already diverged:
 * `exportedImages` was in none of them, so a refresh lost the export; and reset cleared
 * fields the autosave list did not carry. A new field added to this type is a type error
 * in all three places until it is handled, which is the point.
 */
export interface DraftSnapshot {
  step: number;
  idea: string;
  model: string;
  brief: string;
  /** The last AI-authored brief, distinct from the user's edits on top of it. */
  finalBrief: string;
  plan: SlidePlan | null;
  approved: boolean;
  activeTab: ArtifactTab;
  messages: Message[];
  mdMode: MdMode;
  /** Row id in `carousels`, set once the deck has been exported. */
  carouselId: string | null;
  /** Groups the revision history for this editing session. Regenerated on reset. */
  draftId: string;
  dueAt: string;
  editableTitle: string;
  editableCaption: string;
  /**
   * Permanent slide URLs. These are Cloudinary URLs now, uploaded by /api/capture the
   * moment the render finishes, so they survive a reload — which is what stops a refresh
   * from re-running the most expensive step in the pipeline.
   */
  exportedImages: string[];
  uploadedImageUrls: string[];
  topicId: string | null;
  topicTitle: string | null;
}

export const WELCOME_MESSAGE_TEXT =
  "Draft dibersihkan. Silakan masukkan ide konten baru atau upload file md untuk memulai.";

/**
 * A draft with nothing in it. `draftId` is injected so this stays pure.
 *
 * `model` is carried over rather than cleared. It is saved with the draft — the deck
 * records which model wrote it — but it is a preference, not content: the picker
 * initialises from the account's model list, and a reset that blanked it left the
 * composer refusing every message with "Pilih model AI dulu" until the user noticed the
 * dropdown had emptied itself.
 */
export function emptyDraft(
  draftId: string,
  opts: { model?: string; now?: Date } = {}
): DraftSnapshot {
  const now = opts.now ?? new Date();
  return {
    step: 1,
    idea: "",
    model: opts.model ?? "",
    brief: "",
    finalBrief: "",
    plan: null,
    approved: false,
    activeTab: "brief",
    messages: [
      {
        sender: "ai",
        text: WELCOME_MESSAGE_TEXT,
        timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ],
    mdMode: "split",
    carouselId: null,
    draftId,
    dueAt: "",
    editableTitle: "",
    editableCaption: "",
    exportedImages: [],
    uploadedImageUrls: [],
    topicId: null,
    topicTitle: null,
  };
}

/**
 * An object URL dies with the page that made it; an uploaded one does not.
 *
 * Exported slides used to be `URL.createObjectURL()` blobs, so persisting them was
 * pointless and revoking them was mandatory. They are Cloudinary URLs now. Both shapes
 * can be in play at once — a Cloudinary outage falls back to blobs — so the two rules
 * that used to be unconditional are now questions about the individual URL: only
 * persist what will still resolve, and only revoke what this page allocated.
 */
export function isPersistedUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function revocableUrls(urls: readonly string[]): string[] {
  return urls.filter((u) => u.startsWith("blob:"));
}

/**
 * Rebuild a draft from whatever localStorage happens to hold.
 *
 * Old drafts predate several of these fields, and a draft written by a build that
 * crashed mid-write can be missing anything, so every field falls back rather than
 * trusting the shape. Object URLs from a previous page are dropped: they parse fine
 * and resolve to nothing, which renders as silently broken images.
 */
export function restoreDraft(
  raw: unknown,
  fallbackDraftId: string,
  opts: { model?: string } = {}
): DraftSnapshot {
  const base = emptyDraft(fallbackDraftId, { model: opts.model });
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<DraftSnapshot> & Record<string, unknown>;

  const str = (v: unknown, d: string) => (typeof v === "string" && v ? v : d);
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  return {
    step: typeof p.step === "number" ? p.step : base.step,
    idea: str(p.idea, base.idea),
    model: str(p.model, base.model),
    brief: str(p.brief, base.brief),
    finalBrief: str(p.finalBrief ?? p.brief, base.finalBrief),
    plan: (p.plan as SlidePlan | null) ?? base.plan,
    approved: typeof p.approved === "boolean" ? p.approved : base.approved,
    activeTab: (str(p.activeTab, base.activeTab) as ArtifactTab),
    messages: Array.isArray(p.messages) && p.messages.length > 0 ? (p.messages as Message[]) : base.messages,
    mdMode: (str(p.mdMode, base.mdMode) as MdMode),
    carouselId: typeof p.carouselId === "string" ? p.carouselId : base.carouselId,
    draftId: str(p.draftId, base.draftId),
    dueAt: str(p.dueAt, base.dueAt),
    editableTitle: str(p.editableTitle, base.editableTitle),
    editableCaption: str(p.editableCaption, base.editableCaption),
    exportedImages: list(p.exportedImages).filter(isPersistedUrl),
    uploadedImageUrls: list(p.uploadedImageUrls).filter(isPersistedUrl),
    topicId: typeof p.topicId === "string" ? p.topicId : base.topicId,
    topicTitle: typeof p.topicTitle === "string" ? p.topicTitle : base.topicTitle,
  };
}

/**
 * What actually goes to localStorage.
 *
 * Blob URLs are stripped for the reason above. The origin quota is ~5 MB and an imported
 * deck plus its plan and transcript can approach it, so nothing derivable is stored.
 */
export function serializeDraft(d: DraftSnapshot): DraftSnapshot {
  return {
    ...d,
    exportedImages: d.exportedImages.filter(isPersistedUrl),
    uploadedImageUrls: d.uploadedImageUrls.filter(isPersistedUrl),
  };
}
