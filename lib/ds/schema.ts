import { z } from "zod";

const cardTone = z.enum(["peach", "stone", "mint", "sky", "pink", "amber"]);

/* ── Mockup types ─────────────────────────────────────────────── */

/** Classic InfoCard — icon + title + body on a colored card */
const mockupCard = z.object({
  type: z.literal("card"),
  icon: z.string(),
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
  icon: z.string(),
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

/* ── Slide types ──────────────────────────────────────────────── */

const coverSlide = z.object({
  role: z.literal("cover"),
  eyebrow: z.string().max(40),
  headline: z.string().max(90),
  accentWord: z.string().optional(),
  lede: z.string().max(140).optional(),
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
      icon: z.string(),
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
