# Vour Carousels SaaS — Plan 4: AI Generation + Brief/HTML Gates

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax. Execution is INLINE (no subagents) per user preference.

**Goal:** Turn a content idea into an approved on-brand carousel entirely in-app: idea → AI Markdown brief (gate 1, revisable) → AI `slidePlan` → rendered HTML (gate 2, chat-revisable), multi-model with per-provider keys (Gemini free default; DeepSeek/MIMO opt-in). No export/publish (export shipped in Plan 3; publish is Plan 5).

**Architecture:** Server-only AI calls via Vercel AI SDK (`generateText` for the brief, `generateObject` + `slidePlanSchema` for the plan) behind auth-gated Server Actions, so API keys never reach the client. A small env-gated provider registry lists only models whose key is present. Pure prompt-builders (with the design system's slide-role vocabulary + copy caps) are unit-tested; the thin SDK wrappers are integration/manually verified. A chat-style wizard page wires the two gates, reusing Plan 2's `assembleCarousel` + Plan 3's scaled preview frame.

**Tech Stack:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/deepseek`, `@ai-sdk/openai-compatible`) · zod · Next.js Server Actions · shadcn/ui · Vitest.

## Global Constraints

- Repo root is app root; imports use `@/*`. Execution inline, no subagents.
- AI runs **server-side only** (Server Actions / route handlers); keys never reach the client. Every action is auth-gated (`requireSession`).
- Multi-model via **per-provider keys** in `.env`: `GOOGLE_GENERATIVE_AI_API_KEY` (Gemini, free, DEFAULT), `DEEPSEEK_API_KEY` (optional), `MIMO_API_KEY` + `MIMO_BASE_URL` + `MIMO_MODEL` (optional, OpenAI-compatible). The model dropdown lists ONLY models whose key is present.
- AI output for gate 2 is a **structured `slidePlan`** (zod `slidePlanSchema` from Plan 2), never raw HTML. Revision patches the `slidePlan` (re-validated), never raw HTML.
- Supported roles remain the Plan 2 MVP set: `cover`, `point`, `outro`. Copy caps: eyebrow ≤ 3 words; description concise (mockup ≤ ~100 chars, text ≤ ~140); one accent word per headline.
- App UI uses **shadcn/ui** on the Vercel token set. Carousel content stays Vour Dev.
- Every task ends green (`npm test`) and is committed.

---

### Task 1: Provider registry (env-gated, TDD)

**Files:** Create `lib/ai/registry.ts`, `test/ai/registry.test.ts`. Modify `package.json` (deps).

**Interfaces:**
- `export type ModelId = "gemini" | "deepseek" | "mimo"`
- `export function availableModels(env?: NodeJS.ProcessEnv): ModelId[]` — returns the models whose key(s) are present, Gemini first; `[]` if none.
- `export function defaultModel(env?: NodeJS.ProcessEnv): ModelId | null` — Gemini if available, else the first available, else null.
- `export function resolveModel(id: ModelId): LanguageModel` — returns the AI SDK model instance (throws if its key is missing).

- [ ] **Step 1: Install deps** — `npm install ai @ai-sdk/google @ai-sdk/deepseek @ai-sdk/openai-compatible`

- [ ] **Step 2: Write failing test** `test/ai/registry.test.ts`

```ts
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
```

- [ ] **Step 3: Run → FAIL** — `npx vitest run test/ai/registry.test.ts`.

- [ ] **Step 4: Implement** `lib/ai/registry.ts`

```ts
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
      return google("gemini-2.5-flash");
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
```

Note: verify the exact `@ai-sdk/*` factory names against the installed versions (`createGoogleGenerativeAI`, `createDeepSeek`, `createOpenAICompatible`); adjust import names if the installed package differs, keeping the exported registry API identical.

- [ ] **Step 5: Run → PASS.**
- [ ] **Step 6: Commit** — `git add lib/ai/registry.ts test/ai/registry.test.ts package.json package-lock.json && git commit -m "feat(ai): env-gated multi-model provider registry"`

---

### Task 2: Prompt builders (pure, TDD)

**Files:** Create `lib/ai/prompts.ts`, `test/ai/prompts.test.ts`.

**Interfaces:**
- `export const briefSystem: string` — system prompt for the brief (design-system brief format + copy caps).
- `export function briefUserPrompt(idea: string): string`
- `export const planSystem: string` — system prompt instructing structured `slidePlan` output (roles cover/point/outro, field meanings, copy caps).
- `export function planUserPrompt(brief: string): string`
- `export function reviseUserPrompt(planJson: string, message: string): string`

- [ ] **Step 1: Failing test** `test/ai/prompts.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { briefSystem, briefUserPrompt, planSystem, planUserPrompt, reviseUserPrompt } from "@/lib/ai/prompts";

describe("prompt builders", () => {
  it("brief system encodes the canonical brief + copy caps", () => {
    expect(briefSystem).toMatch(/eyebrow/i);
    expect(briefSystem).toMatch(/cover|outro/i);
  });
  it("brief user prompt embeds the idea", () => {
    expect(briefUserPrompt("idempotency di API")).toContain("idempotency di API");
  });
  it("plan system lists the supported roles", () => {
    expect(planSystem).toMatch(/cover/);
    expect(planSystem).toMatch(/point/);
    expect(planSystem).toMatch(/outro/);
  });
  it("plan user prompt embeds the brief", () => {
    expect(planUserPrompt("# Brief\ncontent")).toContain("# Brief");
  });
  it("revise prompt embeds both the current plan and the instruction", () => {
    const p = reviseUserPrompt('{"slides":[]}', "shorten slide 3");
    expect(p).toContain('{"slides":[]}');
    expect(p).toContain("shorten slide 3");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** `lib/ai/prompts.ts`

```ts
export const briefSystem = `You write short-form carousel briefs for @vourdev, an Indonesian backend/dev-education brand.
Output a Markdown brief only, in this shape:

# Carousel Content — <Title>
## Content Info
- Slides: <5-8>
## Slide 1 — Cover
## Eyebrow (≤ 3 words, ALL CAPS)
## Headline (one short line; ONE accent word)
## Description (≤ ~120 chars)
...repeat per slide (roles: Cover, Point, Outro)...
## Caption
## Hashtags

Rules: concise, technical, Bahasa Indonesia. Eyebrow ≤ 3 words. Headlines short with exactly one word worth accenting. Descriptions ≤ ~120 chars; avoid more than one conjunction (dan/atau/tapi/kalau/karena). Do not invent facts.`;

export function briefUserPrompt(idea: string): string {
  return `Content idea:\n${idea}\n\nWrite the brief.`;
}

export const planSystem = `You convert an approved carousel brief into a structured slide plan for @vourdev.
Return ONLY structured data matching the schema. Supported slide roles:
- "cover": { eyebrow, headline, accentWord?, lede? }
- "point": { counter (e.g. "02 / 05"), eyebrow, headline, accentWord?, body, card?: { icon (Iconify slug e.g. "lucide:repeat"), title, body, tone: peach|stone|mint|sky|pink|amber } }
- "outro": { headline, accentWord?, body? }
Rules: eyebrow ≤ 3 words; headline short with one accentWord that appears verbatim inside the headline; body/description concise; Bahasa Indonesia; also fill title, caption, hashtags (no leading #). Use "point" for the middle slides. Deck spine: cover → points → outro.`;

export function planUserPrompt(brief: string): string {
  return `Approved brief:\n${brief}\n\nProduce the slide plan.`;
}

export function reviseUserPrompt(planJson: string, message: string): string {
  return `Current slide plan (JSON):\n${planJson}\n\nRevision request:\n${message}\n\nReturn the full revised slide plan. Fix issues by editing copy/roles — never by changing layout or CSS. Keep it on-brand and within the caps.`;
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add lib/ai/prompts.ts test/ai/prompts.test.ts && git commit -m "feat(ai): brief/plan/revise prompt builders"`

---

### Task 3: AI wrappers — brief, plan, revise

**Files:** Create `lib/ai/generate.ts`, `test/ai/generate.test.ts`.

**Interfaces:**
- `export async function generateBrief(idea: string, model: LanguageModel): Promise<string>`
- `export async function generateSlidePlan(brief: string, model: LanguageModel): Promise<SlidePlan>`
- `export async function reviseSlidePlan(plan: SlidePlan, message: string, model: LanguageModel): Promise<SlidePlan>`

Each accepts a resolved `LanguageModel` (so tests inject a mock; the action layer resolves the id). `generateSlidePlan`/`reviseSlidePlan` use `generateObject({ model, schema: slidePlanSchema, ... })` and return `result.object` (already schema-valid).

- [ ] **Step 1: Failing test** `test/ai/generate.test.ts` (mock model via `ai/test`)

```ts
import { describe, it, expect } from "vitest";
import { MockLanguageModelV2 } from "ai/test";
import { generateBrief, generateSlidePlan } from "@/lib/ai/generate";

const textModel = new MockLanguageModelV2({
  doGenerate: async () => ({
    finishReason: "stop",
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    content: [{ type: "text", text: "# Carousel Content — Test" }],
    warnings: [],
  }),
});

const planObject = {
  title: "T",
  caption: "c",
  hashtags: ["a"],
  slides: [{ role: "cover", eyebrow: "E", headline: "H", accentWord: "H" }],
};

const objectModel = new MockLanguageModelV2({
  doGenerate: async () => ({
    finishReason: "stop",
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    content: [{ type: "text", text: JSON.stringify(planObject) }],
    warnings: [],
  }),
});

describe("generateBrief", () => {
  it("returns the model text", async () => {
    expect(await generateBrief("idea", textModel)).toContain("# Carousel Content");
  });
});

describe("generateSlidePlan", () => {
  it("returns a schema-valid slide plan", async () => {
    const plan = await generateSlidePlan("# brief", objectModel);
    expect(plan.slides[0].role).toBe("cover");
    expect(plan.title).toBe("T");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** `lib/ai/generate.ts`

```ts
import { generateText, generateObject, type LanguageModel } from "ai";
import { slidePlanSchema, type SlidePlan } from "@/lib/ds/schema";
import { briefSystem, briefUserPrompt, planSystem, planUserPrompt, reviseUserPrompt } from "@/lib/ai/prompts";

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
```

- [ ] **Step 4: Run → PASS.** If the installed `ai` version's `MockLanguageModelV2` shape differs (e.g. `doGenerate` return fields), adjust the mock in the test to match its types — the implementation stays as above. Verify via context7 if needed.

- [ ] **Step 5: Commit** — `git add lib/ai/generate.ts test/ai/generate.test.ts && git commit -m "feat(ai): brief + slidePlan generate/revise wrappers"`

---

### Task 4: Auth-gated Server Actions

**Files:** Create `app/create/actions.ts`.

**Interfaces (all `"use server"`, `requireSession()` first):**
- `export async function listModelsAction(): Promise<ModelId[]>`
- `export async function briefAction(idea: string, id: ModelId): Promise<string>`
- `export async function planAction(brief: string, id: ModelId): Promise<SlidePlan>`
- `export async function reviseAction(plan: SlidePlan, message: string, id: ModelId): Promise<SlidePlan>`

- [ ] **Step 1: Implement** `app/create/actions.ts`

```ts
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
```

- [ ] **Step 2: Typecheck + build** — `npx tsc --noEmit` clean; `npm run build` succeeds.
- [ ] **Step 3: Commit** — `git add app/create/actions.ts && git commit -m "feat(ai): auth-gated server actions for brief/plan/revise"`

---

### Task 5: Wizard — idea + model + brief gate (UI)

**Files:** Create `app/create/page.tsx` (protected), `app/create/wizard.tsx` (client), `.env.example` (append AI keys).

**Interfaces:** `wizard.tsx` exports `Wizard({ models }: { models: ModelId[] })` — a client component holding the wizard state; step ① idea textarea + model `Select`; step ② brief shown in an editable `Textarea` inside a Card with **Approve** and a revise input. Uses the Server Actions from Task 4 with `useTransition` for pending state.

- [ ] **Step 1: Ensure shadcn primitives exist** — `npx shadcn@latest add textarea select` (skip any already present). Confirm `components/ui/textarea.tsx` + `components/ui/select.tsx`.

- [ ] **Step 2: Implement** `app/create/wizard.tsx`

```tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ModelId } from "@/lib/ai/registry";
import { briefAction } from "./actions";

export function Wizard({ models }: { models: ModelId[] }) {
  const [model, setModel] = useState<ModelId | "">(models[0] ?? "");
  const [idea, setIdea] = useState("");
  const [brief, setBrief] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function runBrief() {
    if (!idea.trim() || !model) return;
    setError("");
    start(async () => {
      try {
        setBrief(await briefAction(idea, model as ModelId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed");
      }
    });
  }

  if (models.length === 0) {
    return <p className="text-muted-foreground">No AI model configured. Add an API key to .env.</p>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1 · Your idea</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. idempotency di API — kenapa retry aman"
            rows={3}
          />
          <div className="flex items-center gap-3">
            <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runBrief} disabled={pending || !idea.trim()}>
              {pending ? "Generating…" : "Generate brief"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {brief !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2 · Brief</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={14} />
            <p className="text-sm text-muted-foreground">
              Edit the brief directly, then approve. (HTML gate comes in the next step.)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement** `app/create/page.tsx`

```tsx
import { requireSession } from "@/lib/session";
import { availableModels } from "@/lib/ai/registry";
import { Wizard } from "./wizard";

export default async function CreatePage() {
  await requireSession();
  const models = availableModels();
  return (
    <main className="mx-auto mt-[4vh] max-w-[720px] p-6">
      <h1 className="mb-4 text-[32px] tracking-tight">
        <span className="gradient-text">Create</span> carousel
      </h1>
      <Wizard models={models} />
    </main>
  );
}
```

- [ ] **Step 4: Append AI keys to `.env.example`**

```bash
# AI models (Gemini free tier is the default; others optional/paid)
GOOGLE_GENERATIVE_AI_API_KEY=""
DEEPSEEK_API_KEY=""
MIMO_API_KEY=""
MIMO_BASE_URL=""
MIMO_MODEL=""
```

- [ ] **Step 5: Build** — `npm run build` succeeds; `/create` routes. Full suite green.
- [ ] **Step 6: Manual verify** — with `GOOGLE_GENERATIVE_AI_API_KEY` set, `npm run dev`, sign in, open `/create`, type an idea, pick Gemini, **Generate brief** → a Markdown brief appears and is editable.
- [ ] **Step 7: Commit** — `git add app/create .env.example components/ui && git commit -m "feat(create): wizard idea + model + brief gate"`

---

### Task 6: Wizard — HTML gate (preview + chat revise)

**Files:** Modify `app/create/wizard.tsx` (add step ③).

**Interfaces:** After brief approval, call `planAction(brief, model)` → `SlidePlan`; render `assembleCarousel(plan)` in the scaled preview frame (reuse `app/preview/preview-frame.tsx`'s `PreviewFrame`, or extract it to `components/preview-frame.tsx` if cleaner). A revise input calls `reviseAction(plan, message, model)` → new plan → re-render. An **Approve HTML** button reveals the existing **Export** button (Plan 3) fed by `assembleCarousel(approvedPlan)`.

- [ ] **Step 1: Add step ③ to `wizard.tsx`**

Add state `plan: SlidePlan | null`, `html` derived via `assembleCarousel(plan)` (client — `assembleCarousel` is pure), a **Approve brief → generate HTML** button calling `planAction`, a `<PreviewFrame html slideCount={plan.slides.length} />`, a revise `Input` + button calling `reviseAction`, and on **Approve HTML** render `<ExportButton html={html} />`. Import:
```ts
import { assembleCarousel } from "@/lib/ds/assemble";
import { PreviewFrame } from "@/app/preview/preview-frame";
import { ExportButton } from "@/app/preview/export-button";
import { planAction, reviseAction } from "./actions";
import type { SlidePlan } from "@/lib/ds/schema";
```
Wire each async call with the existing `useTransition` + error handling pattern. Guard: revise/plan buttons disabled while pending.

- [ ] **Step 2: Typecheck + build** — `npx tsc --noEmit` clean; `npm run build` succeeds.
- [ ] **Step 3: Manual verify** — `/create`: idea → brief → **generate HTML** → carousel renders in the preview; a revise instruction ("perpendek slide 2") re-renders; **Approve HTML** shows Export → downloads JPEGs.
- [ ] **Step 4: react-best-practices pass** — review the wizard TSX (client boundaries, no inline component definitions, `useTransition` for pending, stable handlers); fix any findings.
- [ ] **Step 5: Commit** — `git add app/create && git commit -m "feat(create): HTML gate with preview + chat revise + export handoff"`

---

## Self-Review

**Spec coverage (Plan 4 = spec §2 steps ①②③, §3 AI layer, §6 wizard UI):**
- §3 provider registry, per-provider keys, env-gated dropdown → Task 1.
- §3 gate-1 brief (generateText) → Tasks 2, 3, 5.
- §3 gate-2 slidePlan (generateObject + slidePlanSchema) → Tasks 2, 3, 6.
- §3 revision patches the structured plan → Tasks 2, 3, 6.
- §3 server-only, auth-gated → Task 4.
- §6 chat-style wizard, shadcn → Tasks 5, 6.
- Deferred (correct): export reused from Plan 3 (Task 6 handoff); publish is Plan 5.

**Placeholder scan:** logic/prompts/registry/wrappers/actions have complete code; Task 6 step 1 describes concrete wiring reusing already-defined interfaces (assembleCarousel, PreviewFrame, ExportButton, the actions) — no undefined symbols.

**Type consistency:** `ModelId` (registry) flows through `resolveModel`, the actions, and the wizard. `SlidePlan`/`slidePlanSchema` (Plan 2) used by `generateSlidePlan`/`reviseSlidePlan`/actions/wizard. `LanguageModel` (ai) is the injected type for the wrappers. `assembleCarousel`/`PreviewFrame`/`ExportButton` are the existing Plan 2/3 exports.

**Risks:** AI SDK factory/mock API names may differ by installed version — Tasks 1 & 3 note verifying against the installed packages (context7). `generateObject` may fail schema on weak models → a follow-up can add one repair retry (spec §10.5); MVP surfaces the error.
