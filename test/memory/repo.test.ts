import { describe, it, expect } from "vitest";
import {
  appendRevision,
  listRevisions,
  clearRevisions,
  MAX_REMEMBERED_TURNS,
} from "@/lib/memory/repo";

describe("revision memory repo", () => {
  it("replays turns oldest-first so the prompt reads as a chronology", async () => {
    const user = `u-${crypto.randomUUID()}`;
    const draft = `d-${crypto.randomUUID()}`;

    await appendRevision({ userId: user, draftId: draft, stage: "plan", request: "first", outcome: "a" });
    await appendRevision({ userId: user, draftId: draft, stage: "plan", request: "second", outcome: "b" });

    const turns = await listRevisions(user, draft);
    expect(turns.map((t) => t.request)).toEqual(["first", "second"]);
    expect(turns[0].outcome).toBe("a");
  });

  it("filters by stage so a brief edit never leaks into a plan revision", async () => {
    const user = `u-${crypto.randomUUID()}`;
    const draft = `d-${crypto.randomUUID()}`;

    await appendRevision({ userId: user, draftId: draft, stage: "brief", request: "brief edit" });
    await appendRevision({ userId: user, draftId: draft, stage: "plan", request: "plan edit" });

    expect((await listRevisions(user, draft, "plan")).map((t) => t.request)).toEqual(["plan edit"]);
    expect((await listRevisions(user, draft, "brief")).map((t) => t.request)).toEqual(["brief edit"]);
    expect(await listRevisions(user, draft)).toHaveLength(2);
  });

  it("scopes memory to the owner and to the draft", async () => {
    const owner = `u-${crypto.randomUUID()}`;
    const other = `u-${crypto.randomUUID()}`;
    const draft = `d-${crypto.randomUUID()}`;
    const otherDraft = `d-${crypto.randomUUID()}`;

    await appendRevision({ userId: owner, draftId: draft, stage: "plan", request: "mine" });

    expect(await listRevisions(other, draft)).toHaveLength(0);
    expect(await listRevisions(owner, otherDraft)).toHaveLength(0);
  });

  it("keeps the most RECENT turns when a draft exceeds the cap", async () => {
    const user = `u-${crypto.randomUUID()}`;
    const draft = `d-${crypto.randomUUID()}`;

    for (let i = 0; i < MAX_REMEMBERED_TURNS + 5; i++) {
      await appendRevision({ userId: user, draftId: draft, stage: "plan", request: `turn ${i}` });
    }

    const turns = await listRevisions(user, draft);
    expect(turns).toHaveLength(MAX_REMEMBERED_TURNS);
    // Oldest five dropped, newest kept, still chronological.
    expect(turns[0].request).toBe("turn 5");
    expect(turns[turns.length - 1].request).toBe(`turn ${MAX_REMEMBERED_TURNS + 4}`);
  });

  it("clears a draft's memory without touching another draft", async () => {
    const user = `u-${crypto.randomUUID()}`;
    const published = `d-${crypto.randomUUID()}`;
    const stillEditing = `d-${crypto.randomUUID()}`;

    await appendRevision({ userId: user, draftId: published, stage: "plan", request: "x" });
    await appendRevision({ userId: user, draftId: stillEditing, stage: "plan", request: "y" });

    await clearRevisions(user, published);

    expect(await listRevisions(user, published)).toHaveLength(0);
    expect(await listRevisions(user, stillEditing)).toHaveLength(1);
  });
});
