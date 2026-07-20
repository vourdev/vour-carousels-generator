import { describe, it, expect } from "vitest";
import { availableModels, defaultModel } from "@/lib/ai/registry";

const base = {} as NodeJS.ProcessEnv;

describe("availableModels", () => {
  it("is empty when no keys are set", () => {
    expect(availableModels(base)).toEqual([]);
  });
  it("lists gemini when its key is present", () => {
    expect(availableModels({ ...base, GOOGLE_GENERATIVE_AI_API_KEY: "k" })).toEqual(["gemini"]);
  });
  it("lists gemini first, then opt-in providers", () => {
    const env = { ...base, GOOGLE_GENERATIVE_AI_API_KEY: "k", DEEPSEEK_API_KEY: "d" };
    expect(availableModels(env)).toEqual(["gemini", "deepseek"]);
  });
  it("requires all MIMO vars for mimo", () => {
    expect(availableModels({ ...base, MIMO_API_KEY: "m" })).toEqual([]);
    const full = { ...base, MIMO_API_KEY: "m", MIMO_BASE_URL: "u", MIMO_MODEL: "x" };
    expect(availableModels(full)).toEqual(["mimo"]);
  });
  it("lists openrouter when its key is present", () => {
    expect(availableModels({ ...base, OPENROUTER_API_KEY: "o" })).toEqual(["openrouter"]);
  });
  it("requires all OMNIROUTE vars for omniroute", () => {
    expect(availableModels({ ...base, OMNIROUTE_API_KEY: "o" })).toEqual([]);
    const fullModel = { ...base, OMNIROUTE_API_KEY: "k", OMNIROUTE_BASE_URL: "u", OMNIROUTE_MODEL: "m" };
    expect(availableModels(fullModel)).toEqual(["omniroute"]);

    const fullCombo = { ...base, OMNIROUTE_API_KEY: "k", OMNIROUTE_BASE_URL: "u", OMNIROUTE_COMBO: "my-combo" };
    expect(availableModels(fullCombo)).toEqual(["omniroute"]);
  });
});

describe("defaultModel", () => {
  it("prefers gemini", () => {
    expect(defaultModel({ ...base, GOOGLE_GENERATIVE_AI_API_KEY: "k", DEEPSEEK_API_KEY: "d" })).toBe("gemini");
  });
  it("falls back to the first available", () => {
    expect(defaultModel({ ...base, DEEPSEEK_API_KEY: "d" })).toBe("deepseek");
  });
  it("is null when nothing is configured", () => {
    expect(defaultModel(base)).toBeNull();
  });
});
