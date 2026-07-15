"use server";

import { requireSession } from "@/lib/session";
import { availableModels, resolveModel, type ModelId } from "@/lib/ai/registry";
import { generateBrief, generateSlidePlan, reviseSlidePlan } from "@/lib/ai/generate";
import type { SlidePlan } from "@/lib/ds/schema";

async function guardModel(id: ModelId) {
  await requireSession();
  if (!availableModels().includes(id)) throw new Error(`model "${id}" is not configured`);
  return resolveModel(id);
}

export async function listModelsAction(): Promise<ModelId[]> {
  await requireSession();
  return availableModels();
}

export async function briefAction(idea: string, id: ModelId): Promise<string> {
  const model = await guardModel(id);
  return generateBrief(idea, model);
}

export async function planAction(brief: string, id: ModelId): Promise<SlidePlan> {
  const model = await guardModel(id);
  return generateSlidePlan(brief, model);
}

export async function reviseAction(plan: SlidePlan, message: string, id: ModelId): Promise<SlidePlan> {
  const model = await guardModel(id);
  return reviseSlidePlan(plan, message, model);
}
