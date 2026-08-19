"use server";

import { requireSession } from "@/lib/session";
import { backendSend } from "@/lib/backend";
import {
  createCarousel,
  updateCarousel,
  getCarousel,
  deleteCarousel,
  type CarouselSource,
  type CarouselStatus,
  type Carousel,
} from "@/lib/history/repo";

/** Persist a freshly-exported carousel. Returns the new carousel id. */
export async function saveExportedCarouselAction(input: {
  source: CarouselSource;
  title: string;
  caption: string;
  hashtags: string[];
  slideCount: number;
  model: string | null;
  thumbnail: string | null;
  imageUrls: string[];
}): Promise<string> {
  const session = await requireSession();
  const c = await createCarousel({
    userId: session.user.id,
    source: input.source,
    title: input.title,
    caption: input.caption,
    hashtags: input.hashtags,
    slideCount: input.slideCount,
    model: input.model,
    status: "exported",
    thumbnail: input.thumbnail,
    imageUrls: input.imageUrls,
  });
  return c.id;
}

export async function markCarouselStatusAction(
  id: string,
  patch: {
    status?: CarouselStatus;
    bufferIgId?: string;
    bufferTtId?: string;
    dueAt?: string;
    title?: string;
    caption?: string;
    imageUrls?: string[];
    thumbnail?: string | null;
  }
): Promise<void> {
  await requireSession();
  await updateCarousel(id, patch);
}

/**
 * Publish a stock carousel directly from the calendar page.
 *
 * The backend loads the row and builds the post text itself — this used to be
 * a second implementation here, and it posted the caption with every hashtag
 * dropped. It also marks the row scheduled, so the status and the Buffer ids
 * are written by whoever actually made the call.
 */
export async function publishSavedCarouselAction(
  id: string,
  dueAt: string
): Promise<{ igPostId?: string; ttPostId?: string }> {
  await requireSession();
  return backendSend("/api/publish/carousel", { carouselId: id, dueAt });
}

export async function deleteCarouselAction(id: string): Promise<void> {
  const session = await requireSession();
  const c = await getCarousel(id, session.user.id);
  // Only delete draft/temporary or failed carousels. Never delete scheduled/posted ones on reset!
  if (c && c.status !== "scheduled" && c.status !== "posted") {
    await deleteCarousel(id, session.user.id);
  }
}
