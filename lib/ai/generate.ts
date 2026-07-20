import { generateText, generateObject, type LanguageModel } from "ai";
import { slidePlanSchema, type SlidePlan } from "@/lib/ds/schema";
import {
  briefSystem,
  briefUserPrompt,
  planSystem,
  planUserPrompt,
  reviseUserPrompt,
} from "@/lib/ai/prompts";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      console.error(`AI call attempt ${i + 1} failed:`, err);
      lastError = err;
      if (i < attempts - 1) {
        // Exponential backoff: 2.5s, 5s
        await delay((i + 1) * 2500);
      }
    }
  }
  
  let extraInfo = "";
  if (lastError?.responseBody) {
    const bodyStr = String(lastError.responseBody).trim();
    extraInfo = ` (Response: ${bodyStr.substring(0, 250)})`;
  } else if (lastError?.cause) {
    extraInfo = ` (Cause: ${lastError.cause?.message || String(lastError.cause)})`;
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed after ${attempts} attempts. Last error: ${msg}${extraInfo}`);
}

function extractAndParseJson(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
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
    try {
      const { object } = await generateObject({
        model,
        schema: slidePlanSchema,
        system: planSystem,
        prompt: planUserPrompt(brief),
      });
      return object;
    } catch (err: any) {
      console.warn("generateObject failed, trying generateText + JSON parse fallback:", err?.message || err);
      const { text } = await generateText({
        model,
        system: planSystem + "\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown codeblocks or extra text.",
        prompt: planUserPrompt(brief),
      });
      const parsed = extractAndParseJson(text);
      return slidePlanSchema.parse(parsed);
    }
  });
}

export async function reviseSlidePlan(
  plan: SlidePlan,
  message: string,
  model: LanguageModel
): Promise<SlidePlan> {
  return withRetry(async () => {
    try {
      const { object } = await generateObject({
        model,
        schema: slidePlanSchema,
        system: planSystem,
        prompt: reviseUserPrompt(JSON.stringify(plan), message),
      });
      return object;
    } catch (err: any) {
      console.warn("reviseObject failed, trying generateText + JSON parse fallback:", err?.message || err);
      const { text } = await generateText({
        model,
        system: planSystem + "\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown codeblocks or extra text.",
        prompt: reviseUserPrompt(JSON.stringify(plan), message),
      });
      const parsed = extractAndParseJson(text);
      return slidePlanSchema.parse(parsed);
    }
  });
}
