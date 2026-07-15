import { z } from "zod";

const cardTone = z.enum(["peach", "stone", "mint", "sky", "pink", "amber"]);

const coverSlide = z.object({
  role: z.literal("cover"),
  eyebrow: z.string(),
  headline: z.string(),
  accentWord: z.string().optional(),
  lede: z.string().optional(),
});

const pointSlide = z.object({
  role: z.literal("point"),
  counter: z.string(),
  eyebrow: z.string(),
  headline: z.string(),
  accentWord: z.string().optional(),
  body: z.string(),
  card: z
    .object({
      icon: z.string(),
      title: z.string(),
      body: z.string(),
      tone: cardTone,
    })
    .optional(),
});

const outroSlide = z.object({
  role: z.literal("outro"),
  headline: z.string(),
  accentWord: z.string().optional(),
  body: z.string().optional(),
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
