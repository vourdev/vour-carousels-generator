"use server";

import { requireSession } from "@/lib/session";
import { backendGet, backendSend } from "@/lib/backend";
import type { ModelId } from "@/lib/models";
import {
  createTopic,
  deleteTopic,
  bulkDeleteTopics,
  bulkUpdateTopicStatus,
  deleteTopicsByStatus,
  getTopic,
  getTopics,
  getProductsFromDb,
  updateTopic,
  type Topic,
  type TopicCategory,
  type TopicStatus,
} from "@/lib/topics/bank";
import type { GenerateTopicsInput } from "@/lib/topics/types";

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  targetAudience?: string;
  keyBenefit?: string;
  ctaText?: string;
  landingUrl?: string;
  active?: number | boolean;
}

async function sessionUserId(): Promise<string> {
  const session = await requireSession();
  return session.user.id;
}

export async function listTopicsAction(filters?: {
  status?: TopicStatus;
  category?: TopicCategory;
  limit?: number;
}): Promise<Topic[]> {
  const userId = await sessionUserId();
  return getTopics(userId, filters);
}

export async function getProductsAction(): Promise<Product[]> {
  try {
    const data = await backendGet("/api/products");
    const list = Array.isArray(data) ? data : (data?.products ?? []);
    if (list.length > 0) return list;
  } catch (err) {
    console.warn("Failed to fetch products from backend, trying db fallback:", err);
  }
  return getProductsFromDb();
}

export async function createTopicAction(data: {
  title: string;
  category: TopicCategory;
  description?: string;
  keywords?: string[];
  angle?: string;
  priority?: number;
  scheduledDate?: string;
  relatedProductId?: string;
}): Promise<Topic> {
  const userId = await sessionUserId();
  return createTopic({ userId, ...data });
}

export async function updateTopicAction(
  id: string,
  data: Parameters<typeof updateTopic>[2]
): Promise<Topic | null> {
  const userId = await sessionUserId();
  await updateTopic(id, userId, data);
  return getTopic(id, userId);
}

export async function deleteTopicAction(id: string): Promise<void> {
  const userId = await sessionUserId();
  await deleteTopic(id, userId);
}

export async function bulkDeleteTopicsAction(ids: string[]): Promise<void> {
  const userId = await sessionUserId();
  await bulkDeleteTopics(ids, userId);
}

export async function bulkUpdateTopicStatusAction(
  ids: string[],
  status: TopicStatus
): Promise<void> {
  const userId = await sessionUserId();
  await bulkUpdateTopicStatus(ids, userId, status);
}

export async function deleteTopicsByStatusAction(status: TopicStatus): Promise<number> {
  const userId = await sessionUserId();
  return deleteTopicsByStatus(userId, status);
}

export async function generateTopicsAction(input: GenerateTopicsInput): Promise<Topic[]> {
  const data = await backendSend("/api/topics/generate", input);
  return data.topics;
}

export async function generateFromNotesAction(
  rawNotes: string,
  modelId?: ModelId
): Promise<Topic[]> {
  const data = await backendSend("/api/topics/generate-from-notes", {
    rawNotes,
    notes: rawNotes,
    modelId,
  });
  return Array.isArray(data) ? data : (data.topics ?? []);
}

/** Expand a saved topic into a canonical-format brief (used by the /create wizard). */
export async function expandTopicBriefAction(topicId: string, modelId: ModelId): Promise<string> {
  const data = await backendSend(`/api/topics/${topicId}/brief`, { modelId });
  return data.brief;
}

/** Wizard trigger: carousel exported from this topic — link + mark generated. */
export async function linkTopicCarouselAction(topicId: string, carouselId: string): Promise<void> {
  const userId = await sessionUserId();
  await updateTopic(topicId, userId, { status: "generated", carouselId });
}

/** Wizard trigger: carousel scheduled to Buffer — mark topic published. */
export async function markTopicPublishedAction(topicId: string): Promise<void> {
  const userId = await sessionUserId();
  await updateTopic(topicId, userId, { status: "published" });
}
