import type { LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type ModelId = "gemini" | "deepseek" | "mimo" | "openrouter";

function has(env: NodeJS.ProcessEnv, ...keys: string[]): boolean {
  return keys.every((k) => Boolean(env[k]));
}

/** Ordered: gemini (free) first, then opt-in providers. */
export function availableModels(env: NodeJS.ProcessEnv = process.env): ModelId[] {
  const out: ModelId[] = [];
  if (has(env, "GOOGLE_GENERATIVE_AI_API_KEY")) out.push("gemini");
  if (has(env, "DEEPSEEK_API_KEY")) out.push("deepseek");
  if (has(env, "MIMO_API_KEY", "MIMO_BASE_URL", "MIMO_MODEL")) out.push("mimo");
  if (has(env, "OPENROUTER_API_KEY")) out.push("openrouter");
  return out;
}

export function defaultModel(env: NodeJS.ProcessEnv = process.env): ModelId | null {
  return availableModels(env)[0] ?? null;
}

function getGatewayConfig() {
  const env = process.env;
  if (!env.AI_GATEWAY_API_KEY) return {};

  return {
    baseURL: "https://ai-gateway.vercel.sh/v1",
    headers: {
      "Authorization": `Bearer ${env.AI_GATEWAY_API_KEY}`,
    },
  };
}

export function resolveModel(id: ModelId): LanguageModel {
  const env = process.env;
  switch (id) {
    case "gemini": {
      const google = createGoogleGenerativeAI({
        apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
        ...getGatewayConfig(),
      });
      // Use gemini-flash-latest alias as gemini-2.5-flash gets sunset for new accounts.
      return google(env.GEMINI_MODEL || "gemini-flash-latest");
    }
    case "deepseek": {
      const deepseek = createDeepSeek({
        apiKey: env.DEEPSEEK_API_KEY,
        ...getGatewayConfig(),
      });
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
    case "openrouter": {
      const openrouter = createOpenAICompatible({
        name: "openrouter",
        apiKey: env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        headers: {
          "HTTP-Referer": "https://github.com/vourdev/vour-carousels",
          "X-OpenRouter-Title": "Vour Carousels Studio",
        },
      });
      return openrouter(env.OPENROUTER_MODEL || "tencent/hy3:free");
    }
  }
}
