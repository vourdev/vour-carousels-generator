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

/** Flow chain — sequential nodes joined by arrows (pipelines/sequences) */
const mockupFlow = z.object({
  type: z.literal("flow"),
  steps: z
    .array(z.object({ label: z.string().max(24), focus: z.boolean().optional() }))
    .min(2)
    .max(5),
  note: z.string().max(90).optional(),
});

/** Concept hub — parent node → 3–4 child pills (term glossaries) */
const mockupConcept = z.object({
  type: z.literal("concept"),
  parent: z.string().max(20),
  children: z.array(z.string().max(18)).min(2).max(4),
  note: z.string().max(90).optional(),
});

/** Icon hub — center node → 3–4 tool icons via dashed arrows */
const mockupHub = z.object({
  type: z.literal("hub"),
  center: z.string().max(20),
  tools: z
    .array(z.object({ icon: iconField, label: z.string().max(16) }))
    .min(2)
    .max(4),
  note: z.string().max(90).optional(),
});

/** Recap checklist — 3–6 ticked items */
const mockupChecklist = z.object({
  type: z.literal("checklist"),
  items: z.array(z.string().max(48)).min(2).max(6),
  note: z.string().max(90).optional(),
});

/** Browser window — product mockup: url bar + 2–4 stat cards (dashboard look) */
const mockupBrowser = z.object({
  type: z.literal("browser"),
  url: z.string().max(40),
  cards: z
    .array(z.object({ label: z.string().max(24), value: z.string().max(16) }))
    .min(2)
    .max(4),
  note: z.string().max(90).optional(),
});

/** Quote inset — editorial pull-quote (EB Garamond) with optional attribution */
const mockupQuote = z.object({
  type: z.literal("quote"),
  quote: z.string().max(180),
  author: z.string().max(40).optional(),
});

/** Data table — ✗/✓ two-column comparison (2–4 rows): "jangan / lakukan" */
const mockupDataTable = z.object({
  type: z.literal("datatable"),
  noLabel: z.string().max(20).default("Jangan"),
  okLabel: z.string().max(20).default("Lakukan"),
  rows: z
    .array(z.object({ no: z.string().max(50), ok: z.string().max(50) }))
    .min(2)
    .max(4),
});

/** Command list — mono `cmd → desc` rows (2–6): CLI menus, shortcut lists */
const mockupCommandList = z.object({
  type: z.literal("commandlist"),
  rows: z
    .array(z.object({ cmd: z.string().max(24), desc: z.string().max(48) }))
    .min(2)
    .max(6),
  note: z.string().max(90).optional(),
});

/** Timeline — two dated cards side-by-side (then / now, dulu / sekarang) */
const mockupTimeline = z.object({
  type: z.literal("timeline"),
  oldLabel: z.string().max(20),
  oldTitle: z.string().max(30),
  oldBody: z.string().max(90),
  newLabel: z.string().max(20),
  newTitle: z.string().max(30),
  newBody: z.string().max(90),
});

/** Prompt card — a copy-paste AI prompt in a bordered mono block */
const mockupPromptcard = z.object({
  type: z.literal("promptcard"),
  label: z.string().max(20).default("COPY THIS"),
  body: z.string().max(180),
});

/** Folder tree — mono directory listing (3–8 rows), one active row in Ember */
const mockupFolderTree = z.object({
  type: z.literal("foldertree"),
  lines: z
    .array(z.object({ text: z.string().max(48), active: z.boolean().optional() }))
    .min(3)
    .max(8),
});

/** Command palette — Cmd+K menu on an Ink surface: query + 2–5 icon rows */
const mockupCommandPalette = z.object({
  type: z.literal("commandpalette"),
  query: z.string().max(30),
  rows: z
    .array(
      z.object({ icon: iconField, label: z.string().max(40), active: z.boolean().optional() })
    )
    .min(2)
    .max(5),
});

/** Database — two related tables (schema/ERD), each 2–4 typed columns + relation glyph */
const mockupDatabase = z.object({
  type: z.literal("database"),
  tables: z
    .array(
      z.object({
        name: z.string().max(20),
        rows: z
          .array(z.object({ col: z.string().max(16), type: z.string().max(8) }))
          .min(2)
          .max(4),
      })
    )
    .length(2),
  relation: z.string().max(12).default("1 ─< ∞"),
});

/** Git branch — fixed 2-branch SVG diagram (feature branch + merge back to main) */
const mockupGitBranch = z.object({
  type: z.literal("gitbranch"),
  main: z.array(z.string().max(16)).min(2).max(6),
  branch: z.object({ name: z.string().max(16), at: z.number().int().min(0) }),
  mergeLabel: z.string().max(12).default("merge"),
});

export const mockupSchema = z.discriminatedUnion("type", [
  mockupCard,
  mockupTerminal,
  mockupComparison,
  mockupSteps,
  mockupCallout,
  mockupBigstat,
  mockupFlow,
  mockupConcept,
  mockupHub,
  mockupChecklist,
  mockupBrowser,
  mockupQuote,
  mockupDataTable,
  mockupCommandList,
  mockupTimeline,
  mockupPromptcard,
  mockupFolderTree,
  mockupCommandPalette,
  mockupDatabase,
  mockupGitBranch,
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
  /** Slide surface: "ink" (full dark) for deck rhythm; absent/"paper" = default cream */
  surface: z.enum(["paper", "ink"]).optional(),
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
