import { z } from "zod";
import { normalizeIcon } from "@/lib/ds/icons";

const cardTone = z.enum(["peach", "stone", "mint", "sky", "pink", "amber"]);

/** Any incoming icon string is coerced to a valid allowlist slug (fallback: sparkles). */
const iconField = z.string().transform(normalizeIcon);

/* ── Mockup types ─────────────────────────────────────────────── */

/** Classic InfoCard — icon + title + body on a colored card */
const mockupCard = z.object({
  type: z.literal("card"),
  icon: iconField,
  title: z.string().max(50),
  body: z.string().max(120),
  tone: cardTone,
});

/** Mac-style terminal window with syntax-highlighted lines */
const mockupTerminal = z.object({
  type: z.literal("terminal"),
  filename: z.string().max(40),
  lines: z
    .array(
      z.object({
        text: z.string().max(60),
        style: z.enum(["plain", "key", "val", "kw", "cmt", "num"]).default("plain"),
      })
    )
    .max(8),
});

/** Two-panel comparison: loser (stone) vs winner (peach) */
const mockupComparison = z.object({
  type: z.literal("comparison"),
  loserLabel: z.string().max(40),
  loserLine: z.string().max(70),
  winnerLabel: z.string().max(40),
  winnerLine: z.string().max(70),
  winnerRationale: z.string().max(100).optional(),
});

/** Numbered step cards (2–4 steps) — for solution/tutorial slides */
const mockupSteps = z.object({
  type: z.literal("steps"),
  items: z
    .array(z.object({ title: z.string().max(40), body: z.string().max(70) }))
    .min(2)
    .max(4),
});

/** Dark callout banner with icon — for key takeaways/warnings */
const mockupCallout = z.object({
  type: z.literal("callout"),
  icon: iconField,
  text: z.string().max(120),
});

/** Big editorial metric — one standout number */
const mockupBigstat = z.object({
  type: z.literal("bigstat"),
  number: z.string().max(10),
  unit: z.string().max(30).optional(),
  caption: z.string().max(90),
});

export const mockupSchema = z.discriminatedUnion("type", [
  mockupCard,
  mockupTerminal,
  mockupComparison,
  mockupSteps,
  mockupCallout,
  mockupBigstat,
]);

export type Mockup = z.infer<typeof mockupSchema>;

/* ── Cover hook (intro scroll-stopper) ────────────────────────── */

const coverHookDevice = z.object({
  kind: z.literal("device"),
  chrome: z.enum(["browser", "terminal"]).default("browser"),
  label: z.string().max(40).optional(),
  lines: z
    .array(
      z.object({
        text: z.string().max(52),
        style: z.enum(["plain", "key", "val", "kw", "cmt", "num"]).default("plain"),
      })
    )
    .min(1)
    .max(6),
});

// Reserved for Phase 2 (wizard attach-screenshot). Not emitted by the wizard yet.
const coverHookImage = z.object({
  kind: z.literal("image"),
  src: z.string(),
  frame: z.enum(["browser", "phone", "plain"]).default("browser"),
  label: z.string().max(40).optional(),
});

const coverHookCustom = z.object({
  kind: z.literal("custom"),
  html: z.string().max(4000),
});

export const coverHookSchema = z.discriminatedUnion("kind", [
  coverHookDevice,
  coverHookImage,
  coverHookCustom,
]);

export type CoverHook = z.infer<typeof coverHookSchema>;

/* ── Slide types ──────────────────────────────────────────────── */

const coverSlide = z.object({
  role: z.literal("cover"),
  eyebrow: z.string().max(40),
  headline: z.string().max(90),
  accentWord: z.string().optional(),
  lede: z.string().max(140).optional(),
  hook: coverHookSchema.optional(),
});

const pointSlide = z.object({
  role: z.literal("point"),
  counter: z.string(),
  eyebrow: z.string().max(40),
  headline: z.string().max(90),
  accentWord: z.string().optional(),
  body: z.string().max(160),
  /** New: rich mockup component (preferred) */
  mockup: mockupSchema.optional(),
  /** Legacy: simple info card (backward compat — used when mockup is absent) */
  card: z
    .object({
      icon: iconField,
      title: z.string().max(50),
      body: z.string().max(120),
      tone: cardTone,
    })
    .optional(),
});

const outroSlide = z.object({
  role: z.literal("outro"),
  eyebrow: z.string().max(40).optional(),
  headline: z.string().max(90),
  accentWord: z.string().optional(),
  body: z.string().max(160).optional(),
  cta: z.object({
    strong: z.string().max(60),
    sub: z.string().max(90).optional(),
  }),
});

export const slideSchema = z.discriminatedUnion("role", [coverSlide, pointSlide, outroSlide]);

export const slidePlanSchema = z.object({
  title: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  slides: z.array(slideSchema).min(1),
});

export type Slide = z.infer<typeof slideSchema>;
export type SlidePlan = z.infer<typeof slidePlanSchema>;
