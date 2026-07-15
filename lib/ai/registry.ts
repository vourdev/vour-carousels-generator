import type { LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type ModelId = "gemini" | "deepseek" | "mimo";

function has(env: NodeJS.ProcessEnv, ...keys: string[]): boolean {
  return keys.every((k) => Boolean(env[k]));
}

/** Ordered: gemini (free) first, then opt-in providers. */
export function availableModels(env: NodeJS.ProcessEnv = process.env): ModelId[] {
  const out: ModelId[] = [];
  if (has(env, "GOOGLE_GENERATIVE_AI_API_KEY")) out.push("gemini");
  if (has(env, "DEEPSEEK_API_KEY")) out.push("deepseek");
  if (has(env, "MIMO_API_KEY", "MIMO_BASE_URL", "MIMO_MODEL")) out.push("mimo");
  return out;
}

export function defaultModel(env: NodeJS.ProcessEnv = process.env): ModelId | null {
  return availableModels(env)[0] ?? null;
}

export function resolveModel(id: ModelId): LanguageModel {
  const env = process.env;
  switch (id) {
    case "gemini": {
      const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY });
      // Use the latest stable Gemini model: gemini-2.5-flash.
      return google(env.GEMINI_MODEL || "gemini-2.5-flash");
    }
    case "deepseek": {
      const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY });
      return deepseek("deepseek-chat");
    }
    case "mimo": {
      const mimo = createOpenAICompatible({
        name: "mimo",
        apiKey: env.MIMO_API_KEY,
        baseURL: env.MIMO_BASE_URL as string,
      });
      return mimo(env.MIMO_MODEL as string);
    }
  }
}
