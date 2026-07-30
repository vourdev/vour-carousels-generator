"use server";

import { requireSession } from "@/lib/session";
import { availableModels, resolveModel, type ModelId } from "@/lib/ai/registry";
import {
  createTopic,
  deleteTopic,
  getTopic,
  getTopics,
  updateTopic,
  type Topic,
  type TopicCategory,
  type TopicStatus,
} from "@/lib/topics/bank";
import { expandTopicToBrief } from "@/lib/topics/generator";
import { generateAndSaveTopics, type GenerateTopicsInput } from "@/lib/topics/service";

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

export async function createTopicAction(data: {
  title: string;
  category: TopicCategory;
  description?: string;
  keywords?: string[];
  angle?: string;
  priority?: number;
  scheduledDate?: string;
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

export async function generateTopicsAction(input: GenerateTopicsInput): Promise<Topic[]> {
  const userId = await sessionUserId();
  const modelId = availableModels()[0];
  if (!modelId) throw new Error("No AI model configured");
  const model = resolveModel(modelId as ModelId);
  return generateAndSaveTopics(userId, model, input);
}

/** Expand a saved topic into a canonical-format brief (used by the /create wizard). */
export async function expandTopicBriefAction(topicId: string, modelId: ModelId): Promise<string> {
  const userId = await sessionUserId();
  if (!availableModels().includes(modelId)) throw new Error(`model "${modelId}" is not configured`);
  const topic = await getTopic(topicId, userId);
  if (!topic) throw new Error("Topic not found");
  return expandTopicToBrief(topic, resolveModel(modelId));
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
