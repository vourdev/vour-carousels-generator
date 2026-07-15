import { generateText, generateObject, type LanguageModel } from "ai";
import { slidePlanSchema, type SlidePlan } from "@/lib/ds/schema";
import {
  briefSystem,
  briefUserPrompt,
  planSystem,
  planUserPrompt,
  reviseUserPrompt,
} from "@/lib/ai/prompts";

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed after ${attempts} attempts. Last error: ${msg}`);
}

export async function generateBrief(idea: string, model: LanguageModel): Promise<string> {
  return withRetry(async () => {
    const { text } = await generateText({
      model,
      system: briefSystem,
      prompt: briefUserPrompt(idea),
    });
    return text;
  });
}

export async function generateSlidePlan(brief: string, model: LanguageModel): Promise<SlidePlan> {
  return withRetry(async () => {
    const { object } = await generateObject({
      model,
      schema: slidePlanSchema,
      system: planSystem,
      prompt: planUserPrompt(brief),
    });
    return object;
  });
}

export async function reviseSlidePlan(
  plan: SlidePlan,
  message: string,
  model: LanguageModel
): Promise<SlidePlan> {
  return withRetry(async () => {
    const { object } = await generateObject({
      model,
      schema: slidePlanSchema,
      system: planSystem,
      prompt: reviseUserPrompt(JSON.stringify(plan), message),
    });
    return object;
  });
}
