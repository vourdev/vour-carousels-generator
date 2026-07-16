import { describe, it, expect } from "vitest";
import {
  createCarousel,
  updateCarousel,
  listCarousels,
  getCarousel,
} from "@/lib/history/repo";

describe("carousel history repo", () => {
  it("creates, lists, gets, and updates a carousel", async () => {
    const user = `u-${crypto.randomUUID()}`;

    const c = await createCarousel({
      userId: user,
      source: "ai",
      title: "Idempotency",
      caption: "cap",
      hashtags: ["backend", "api"],
      slideCount: 3,
      model: "gemini",
      status: "exported",
      thumbnail: "https://res.cloudinary.com/x/thumb.jpg",
    });

    expect(c.id).toBeTruthy();
    expect(c.hashtags).toEqual(["backend", "api"]);
    expect(c.status).toBe("exported");

    const fetched = await getCarousel(c.id, user);
    expect(fetched?.title).toBe("Idempotency");

    await updateCarousel(c.id, { status: "scheduled", bufferIgId: "ig-123" });
    const updated = await getCarousel(c.id, user);
    expect(updated?.status).toBe("scheduled");
    expect(updated?.bufferIgId).toBe("ig-123");

    const list = await listCarousels(user);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(c.id);
  });

  it("scopes reads to the owner", async () => {
    const owner = `u-${crypto.randomUUID()}`;
    const other = `u-${crypto.randomUUID()}`;
    const c = await createCarousel({ userId: owner, source: "upload", title: "Mine" });
    expect(await getCarousel(c.id, other)).toBeNull();
    expect(await listCarousels(other)).toHaveLength(0);
  });
});
