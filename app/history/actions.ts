"use server";

import { requireSession } from "@/lib/session";
import { uploadImage } from "@/lib/publish/cloudinary";
import {
  createCarousel,
  updateCarousel,
  getCarousel,
  deleteCarousel,
  type CarouselSource,
  type CarouselStatus,
  type Carousel,
} from "@/lib/history/repo";
import { scheduleBufferPost } from "@/lib/publish/buffer";
import type { SlidePlan } from "@/lib/ds/schema";

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

/** Publish a stock carousel directly from the calendar page. */
export async function publishSavedCarouselAction(
  id: string,
  dueAt: string
): Promise<{ igPostId?: string; ttPostId?: string }> {
  const session = await requireSession();
  const c = await getCarousel(id, session.user.id);
  if (!c) throw new Error("Carousel not found");
  if (!c.imageUrls || c.imageUrls.length === 0) {
    throw new Error("Carousel has no exported slides");
  }

  const igChannelId = process.env.BUFFER_IG_CHANNEL_ID;
  const ttChannelId = process.env.BUFFER_TIKTOK_CHANNEL_ID;

  if (!igChannelId && !ttChannelId) {
    throw new Error("Neither BUFFER_IG_CHANNEL_ID nor BUFFER_TIKTOK_CHANNEL_ID is configured");
  }

  const results: { igPostId?: string; ttPostId?: string } = {};

  if (igChannelId) {
    results.igPostId = await scheduleBufferPost({
      channelId: igChannelId,
      text: c.caption,
      assets: c.imageUrls,
      dueAt,
    });
  }

  if (ttChannelId) {
    results.ttPostId = await scheduleBufferPost({
      channelId: ttChannelId,
      text: c.caption,
      assets: c.imageUrls,
      dueAt,
      isTikTok: true,
      title: c.title,
    });
  }

  // Mark as scheduled in the database
  await updateCarousel(id, {
    status: "scheduled",
    bufferIgId: results.igPostId || null,
    bufferTtId: results.ttPostId || null,
    dueAt,
  });

  return results;
}

export async function deleteCarouselAction(id: string): Promise<void> {
  const session = await requireSession();
  const c = await getCarousel(id, session.user.id);
  // Only delete draft/temporary or failed carousels. Never delete scheduled/posted ones on reset!
  if (c && c.status !== "scheduled" && c.status !== "posted") {
    await deleteCarousel(id, session.user.id);
  }
}
