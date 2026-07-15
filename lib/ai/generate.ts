import { generateText, generateObject, type LanguageModel } from "ai";
import { slidePlanSchema, type SlidePlan } from "@/lib/ds/schema";
import {
  briefSystem,
  briefUserPrompt,
  planSystem,
  planUserPrompt,
  reviseUserPrompt,
} from "@/lib/ai/prompts";

export async function generateBrief(idea: string, model: LanguageModel): Promise<string> {
  const { text } = await generateText({
    model,
    system: briefSystem,
    prompt: briefUserPrompt(idea),
  });
  return text;
}

export async function generateSlidePlan(brief: string, model: LanguageModel): Promise<SlidePlan> {
  const { object } = await generateObject({
    model,
    schema: slidePlanSchema,
    system: planSystem,
    prompt: planUserPrompt(brief),
  });
  return object;
}

export async function reviseSlidePlan(
  plan: SlidePlan,
  message: string,
  model: LanguageModel
): Promise<SlidePlan> {
  const { object } = await generateObject({
    model,
    schema: slidePlanSchema,
    system: planSystem,
    prompt: reviseUserPrompt(JSON.stringify(plan), message),
  });
  return object;
}
