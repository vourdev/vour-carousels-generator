import { describe, it, expect } from "vitest";
import {
  emptyDraft,
  restoreDraft,
  serializeDraft,
  isPersistedUrl,
  revocableUrls,
  type DraftSnapshot,
} from "@/app/create/draft-state";

const CLOUDINARY = "https://res.cloudinary.com/x/image/upload/v1/vourdev-carousels/a.jpg";

function filled(over: Partial<DraftSnapshot> = {}): DraftSnapshot {
  return {
    ...emptyDraft("draft-1"),
    step: 4,
    idea: "index database",
    model: "vour-high",
    brief: "# Brief\nisi",
    finalBrief: "# Brief\nisi",
    approved: true,
    carouselId: "car-1",
    dueAt: "2026-09-01T09:00",
    editableTitle: "Judul",
    editableCaption: "Caption",
    exportedImages: [CLOUDINARY],
    uploadedImageUrls: [CLOUDINARY],
    topicId: "topic-1",
    topicTitle: "Index",
    ...over,
  };
}

describe("emptyDraft", () => {
  it("clears every field a draft owns", () => {
    const d = emptyDraft("new-id");
    expect(d.brief).toBe("");
    expect(d.finalBrief).toBe("");
    expect(d.plan).toBeNull();
    expect(d.step).toBe(1);
    expect(d.carouselId).toBeNull();
    expect(d.topicId).toBeNull();
    expect(d.draftId).toBe("new-id");
  });

  // The bug this whole shape exists to prevent: the exported slides are a draft field
  // now, so a reset that forgets them leaves the previous deck's images on screen.
  it("clears the export result", () => {
    const d = emptyDraft("new-id");
    expect(d.exportedImages).toEqual([]);
    expect(d.uploadedImageUrls).toEqual([]);
  });

  // A reset that reused the id would hand the next draft the previous one's revision
  // history, which is what the server keys revisions on.
  it("takes a fresh draft id", () => {
    expect(emptyDraft("a").draftId).not.toBe(emptyDraft("b").draftId);
  });
});

describe("isPersistedUrl / revocableUrls", () => {
  it("separates uploaded URLs from this page's object URLs", () => {
    expect(isPersistedUrl(CLOUDINARY)).toBe(true);
    expect(isPersistedUrl("blob:http://localhost:3000/abc-123")).toBe(false);
    expect(revocableUrls([CLOUDINARY, "blob:x", "blob:y"])).toEqual(["blob:x", "blob:y"]);
  });
});

describe("serializeDraft", () => {
  it("keeps uploaded slide URLs, which is what survives the reload", () => {
    const out = serializeDraft(filled());
    expect(out.exportedImages).toEqual([CLOUDINARY]);
    expect(out.uploadedImageUrls).toEqual([CLOUDINARY]);
  });

  // An object URL serializes fine and resolves to nothing on the next page, which
  // renders as a gallery of broken images rather than as "not exported yet".
  it("drops object URLs instead of persisting a dead reference", () => {
    const out = serializeDraft(filled({ exportedImages: ["blob:http://x/1", CLOUDINARY] }));
    expect(out.exportedImages).toEqual([CLOUDINARY]);
  });
});

describe("restoreDraft", () => {
  it("round-trips a full draft", () => {
    const before = filled();
    const after = restoreDraft(JSON.parse(JSON.stringify(serializeDraft(before))), "unused");
    expect(after).toEqual(before);
  });

  // The whole point of BUG 1: after a refresh the slides are already there.
  it("brings the exported slides back", () => {
    const after = restoreDraft({ step: 4, exportedImages: [CLOUDINARY] }, "id");
    expect(after.exportedImages).toEqual([CLOUDINARY]);
    expect(after.step).toBe(4);
  });

  it("drops object URLs written by an older build", () => {
    const after = restoreDraft({ exportedImages: ["blob:http://x/1"] }, "id");
    expect(after.exportedImages).toEqual([]);
  });

  // Drafts written before a field existed must not leave that slot untouched — that is
  // how a reset-then-restore used to bring back a value nobody had written.
  it("fills missing fields with their empty value", () => {
    const after = restoreDraft({ brief: "hanya brief" }, "fallback");
    expect(after.brief).toBe("hanya brief");
    expect(after.plan).toBeNull();
    expect(after.exportedImages).toEqual([]);
    expect(after.carouselId).toBeNull();
    expect(after.draftId).toBe("fallback");
  });

  it("falls back to the brief when finalBrief predates the split", () => {
    expect(restoreDraft({ brief: "b" }, "id").finalBrief).toBe("b");
  });

  it("survives junk without taking the editor down", () => {
    expect(restoreDraft(null, "id").brief).toBe("");
    expect(restoreDraft("not an object", "id").brief).toBe("");
    expect(restoreDraft({ step: "four", messages: "nope" }, "id").step).toBe(1);
  });
});
