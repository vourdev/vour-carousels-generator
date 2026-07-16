"use server";

import { requireSession } from "@/lib/session";
import { uploadImage } from "@/lib/publish/cloudinary";
import {
  createCarousel,
  updateCarousel,
  type CarouselSource,
  type CarouselStatus,
} from "@/lib/history/repo";

/** Persist a freshly-exported carousel. Uploads the first slide to Cloudinary
 *  as the history thumbnail. Returns the new carousel id. */
export async function saveExportedCarouselAction(input: {
  source: CarouselSource;
  title: string;
  caption: string;
  hashtags: string[];
  slideCount: number;
  model: string | null;
  thumbnailBase64: string | null;
}): Promise<string> {
  const session = await requireSession();
  let thumbnail: string | null = null;
  if (input.thumbnailBase64) {
    try {
      thumbnail = await uploadImage(input.thumbnailBase64);
    } catch {
      thumbnail = null; // thumbnail is best-effort — never block the save
    }
  }
  const c = await createCarousel({
    userId: session.user.id,
    source: input.source,
    title: input.title,
    caption: input.caption,
    hashtags: input.hashtags,
    slideCount: input.slideCount,
    model: input.model,
    status: "exported",
    thumbnail,
  });
  return c.id;
}

export async function markCarouselStatusAction(
  id: string,
  patch: { status: CarouselStatus; bufferIgId?: string; bufferTtId?: string; dueAt?: string }
): Promise<void> {
  await requireSession();
  await updateCarousel(id, patch);
}
