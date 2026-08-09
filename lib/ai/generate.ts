import { generateText, generateObject, type LanguageModel } from "ai";
import { slidePlanSchema, type SlidePlan } from "@/lib/ds/schema";
import { repairSlidePlan } from "@/lib/ds/repair";
import { normalizeIllustration } from "@/lib/ds/illustrations";
import {
  briefSystem,
  briefUserPrompt,
  planSystem,
  planUserPrompt,
  reviseSystem,
  reviseUserPrompt,
  humanVoiceEditorSystem,
  humanVoiceEditorUserPrompt,
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

/**
 * Analogy keywords that trigger the illustration safety net.
 * If a point slide's body contains any of these words but the model chose
 * a non-illustration mockup, we override it here — no re-generation needed.
 */
const ANALOGY_KEYWORDS = ["kayak", "ibarat", "mirip", "bayangkan", "seperti"];

/** Fallback slug used when the safety net overrides a mockup to illustration. */
const ILLUSTRATION_FALLBACK_SLUG = "online-learning_tgmv";

/**
 * Post-processing pass: enforce illustration mockup for any point slide
 * whose body text signals an analogy/metaphor but the model picked something
 * else. This is a code-level safety net that does not rely on model compliance.
 */
function enforceIllustrationForAnalogySlides(plan: SlidePlan): SlidePlan {
  const slides = plan.slides.map((slide) => {
    if (slide.role !== "point") return slide;
    const body = (slide.body ?? "").toLowerCase();
    const hasAnalogy = ANALOGY_KEYWORDS.some((kw) => body.includes(kw));
    if (!hasAnalogy) return slide;
    if (slide.mockup?.type === "illustration") return slide;
    // Override: the slide uses analogy language but got a technical mockup
    console.warn(
      `[illustration-safety-net] Slide "${slide.eyebrow}" has analogy keywords but mockup="${slide.mockup?.type ?? "none"}". Overriding to illustration.`
    );
    return {
      ...slide,
      mockup: {
        type: "illustration" as const,
        illustrationSlug: normalizeIllustration(ILLUSTRATION_FALLBACK_SLUG),
      },
    };
  });
  return { ...plan, slides };
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
      return enforceIllustrationForAnalogySlides(object);
    } catch (err: any) {
      console.warn("generateObject failed, trying generateText + JSON parse fallback:", err?.message || err);
      const { text } = await generateText({
        model,
        system: planSystem + "\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown codeblocks or extra text.",
        prompt: planUserPrompt(brief),
      });
      const parsed = extractAndParseJson(text);
      const repaired = repairSlidePlan(parsed);
      return enforceIllustrationForAnalogySlides(repaired);
    }
  });
}

/** Prior revision turns on the same draft, oldest first. See lib/memory/repo.ts. */
export type RevisionHistory = { request: string; outcome?: string | null }[];

export async function reviseSlidePlan(
  plan: SlidePlan,
  message: string,
  model: LanguageModel,
  history: RevisionHistory = []
): Promise<SlidePlan> {
  const prompt = reviseUserPrompt(JSON.stringify(plan), message, history);
  return withRetry(async () => {
    try {
      const { object } = await generateObject({
        model,
        schema: slidePlanSchema,
        system: reviseSystem,
        prompt,
      });
      return object;
    } catch (err: any) {
      console.warn("reviseObject failed, trying generateText + JSON parse fallback:", err?.message || err);
      const { text } = await generateText({
        model,
        system: reviseSystem + "\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown codeblocks or extra text.",
        prompt,
      });
      const parsed = extractAndParseJson(text);
      return repairSlidePlan(parsed);
    }
  });
}

export async function polishBriefVoice(brief: string, model: LanguageModel): Promise<string> {
  return withRetry(async () => {
    const { text } = await generateText({
      model,
      system: humanVoiceEditorSystem,
      prompt: humanVoiceEditorUserPrompt(brief),
    });
    return text;
  });
}
