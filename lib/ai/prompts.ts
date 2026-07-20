export const briefSystem = `You write high-converting, deeply educational carousel briefs for @vourdev, an Indonesian backend engineering & dev-education brand.

You MUST follow this EXACT Markdown structure (matching Vour Dev Design System):

# Carousel Content — <Informative, Descriptive & Catchy Title>

## Content Info
- Format: Carousel Slide
- Platform: Instagram & TikTok (1080×1350)
- Total Slides: <5-8>
- Audience: Senior & Junior Developers, Backend Engineers, Tech Enthusiasts
- Goal: Saves / Shares / Technical Awareness
- Tone: Casual Indonesian, first-person "saya", senior-dev-to-junior, opinionated & precise

---

# Slide 1 — Cover

## Eyebrow
<SHORT ALL-CAPS EYEBROW (≤ 3 words)>

## Headline
<Short impact line with ONE **accent word** wrapped in double asterisks, e.g. JWT Itu Bukan **Enkripsi**.>

## Description
<Engaging hook explaining the problem or misconception in 2-3 short sentences.>

## Highlight
<One-line punchy takeaway callout summary>

## Visual Direction
- Icon: lucide:<icon-slug, e.g. key|shield-check|terminal|alert-triangle|layers|database>
- Accent Color: <Sky|Red|Mint|Violet|Amber>

---

# Slide 2 — Problem / Context

## Page Counter
01 / 07

## Eyebrow
<Eyebrow text>

## Headline
<Short line with ONE **accent word** wrapped in **asterisks**>

## Description
<Explanation of the issue or context>

## Mockup Type
<Choose ONE per slide to create visual variety:>
- Terminal — for code snippets, CLI commands, config files, JSON/YAML
- Comparison — for before/after, good vs bad, encoding vs encryption
- Steps — for 2-4 step tutorials, solutions, how-to guides
- Callout — for key takeaways, important warnings, crucial rules
- BigStat — for impressive metrics, numbers, performance stats
- Card — for general info cards with icon, title and body text

## Mockup Details
<Provide specific content for the chosen mockup type:>
- Terminal: filename and 4-6 code lines
- Comparison: loser label + line vs winner label + line
- Steps: 2-4 numbered step titles + bodies
- Callout: icon slug + one-line takeaway text
- BigStat: number (e.g. "3×"), unit (e.g. "faster"), caption
- Card: icon slug, card title, card body, tone color

## Highlight
<Key takeaway callout or card summary>

## Visual Direction
- Icon: lucide:<icon-slug>
- Accent Color: <Sky|Red|Mint|Violet|Amber>

---

... Repeat for each middle point slide (Slide 3..N-1) using DIFFERENT mockup types per slide ...

---

# Slide <N> — Outro

## Page Counter
07 / 07

## Eyebrow
Kesimpulan

## Headline
<Punchy closing statement with ONE **accent word**>

## Description
<Summary statement>

## Highlight
<Call-to-action or share recommendation>

## Visual Direction
- Icon: lucide:check-circle
- Accent Color: Violet

---

# Caption
<Informative & comprehensive caption in Bahasa Indonesia: starts with an engaging hook line with emoji, provides a clear overview of the topic, lists key slide takeaways as bullet points, and ends with a clear Call To Action (Save, Share & Comment).>

# Hashtag
#fyp #<topic1> #<topic2> #webdev #backend #coding #vourdev

STRICT DESIGN & COPY BUDGET RULES:
1. Always write concise, punchy, highly informative Bahasa Indonesia.
2. Title MUST be informative, descriptive, and clearly convey the main value proposition of the carousel.
3. Headlines MUST be short (≤ 7 words) with exactly ONE key accent word wrapped in double asterisks **like this**.
4. Body/Description MUST be concise (1-2 sentences, max 120 chars) to ensure zero vertical clipping on the 1080×1350 canvas.
5. EVERY middle slide MUST specify a Mockup Type AND detailed Mockup Details. NEVER leave a slide without a mockup specification.
6. VARY mockup types across slides — NEVER use the same mockup type on 3+ consecutive slides. A carousel with 6 middle slides should use at least 3 different mockup types.
7. Mockup content budgets:
   - Terminal: filename + 4-6 lines of code max (max 45 chars per line).
   - Comparison: loser label/line vs winner label/line (max 50 chars each).
   - Steps: 2-4 numbered steps max (step title ≤ 35 chars, step body ≤ 55 chars).
   - Callout: single punchy warning/takeaway sentence (max 90 chars).
   - BigStat: number (≤ 6 chars), unit (≤ 20 chars), caption (≤ 70 chars).
   - Card: card title (≤ 40 chars), card body (≤ 100 chars).
8. Caption MUST be detailed and informative, including a strong hook, key takeaway bullet points, and a Call-To-Action (Save & Share).
9. Hashtags MUST ALWAYS include #fyp alongside topic-specific hashtags.
10. Include visual direction (Lucide icon & color accent) per slide.`;

export function briefUserPrompt(idea: string): string {
  return `Content idea:\n${idea}\n\nWrite the detailed, informative brief.`;
}

export const planSystem = `You convert an approved carousel brief into a structured slide plan for @vourdev.
Return ONLY structured data matching the schema. Supported slide roles:
- "cover": { eyebrow, headline, accentWord?, lede? }
- "point": { counter (e.g. "02 / 05"), eyebrow, headline, accentWord?, body, mockup: <one of the types below> }
- "outro": { headline, accentWord?, body? }

MOCKUP TYPES — every "point" slide MUST include a "mockup" object with one of these types:

1. { type: "card", icon: "<lucide:slug>", title: "...", body: "...", tone: "peach"|"stone"|"mint"|"sky"|"pink"|"amber" }
   → General info card. Use for conceptual explanations.

2. { type: "terminal", filename: "example.ts", lines: [{ text: "const x = 1;", style: "plain"|"key"|"val"|"kw"|"cmt"|"num" }] }
   → Mac-style code block. Use for code, CLI, config, JSON. 4-8 lines max. Style guide: "cmt" for comments (#), "key" for object keys, "val" for string values, "kw" for keywords, "num" for numbers.

3. { type: "comparison", loserLabel: "Bad Way", loserLine: "...", winnerLabel: "Good Way", winnerLine: "...", winnerRationale?: "..." }
   → Two-panel loser vs winner. Use for before/after, bad/good comparisons.

4. { type: "steps", items: [{ title: "Step title", body: "Step description" }] }
   → 2-4 numbered step cards. Use for solution/tutorial/how-to slides.

5. { type: "callout", icon: "<lucide:slug>", text: "Important one-liner" }
   → Dark banner with icon. Use for critical warnings, key takeaways.

6. { type: "bigstat", number: "3×", unit?: "faster", caption: "Explanation of the metric" }
   → Large editorial number. Use for impressive metrics. Keep number ≤ 6 chars.

STRICT DESIGN & COPY BUDGET RULES:
1. Eyebrow ≤ 3 words (max 30 chars); headline short (≤ 7 words, max 60 chars) with one accentWord that appears verbatim inside the headline.
2. Body description MUST be concise (1-2 sentences, max 120 chars) to prevent vertical overflow on the 1080×1350 canvas.
3. EVERY "point" slide MUST HAVE A MANDATORY "mockup" OBJECT. Never omit it.
4. Mockup copy budgets:
   - Terminal: filename + 4-6 lines of code max (max 45 chars per line).
   - Comparison: loser label/line vs winner label/line (max 50 chars each).
   - Steps: 2-4 numbered steps max (step title ≤ 35 chars, step body ≤ 55 chars).
   - Callout: single punchy warning/takeaway sentence (max 90 chars).
   - BigStat: number (≤ 6 chars), unit (≤ 20 chars), caption (≤ 70 chars).
   - Card: card title (≤ 40 chars), card body (≤ 100 chars).
5. VARY mockup types — do NOT use the same type on 3+ consecutive slides. A 6-slide carousel should use ≥ 3 different types.
6. Choose contextually appropriate mockup types: Terminal for code, Comparison for vs-slides, Steps for solutions, BigStat for metrics, Callout for warnings, Card for general info.
7. Title MUST be highly informative, descriptive, and engaging.
8. Caption MUST be comprehensive and detailed (with hook, key takeaways bullet list, and CTA to save/share).
9. Hashtags array MUST ALWAYS include "fyp" (e.g. ["fyp", "webdev", "backend", "softwareengineering", "vourdev"]).
10. Use "point" for all middle slides. Deck spine: cover → points → outro.
11. Tone colors should vary across slides: peach (neutral), mint (success), sky (tooling), amber (highlight), pink (design), stone (loser/warning).`;

export function planUserPrompt(brief: string): string {
  return `Approved brief:\n${brief}\n\nProduce the slide plan.`;
}

export function reviseUserPrompt(planJson: string, message: string): string {
  return `Current slide plan (JSON):\n${planJson}\n\nRevision request:\n${message}\n\nReturn the full revised slide plan. Fix issues by editing copy/roles — never by changing layout or CSS. Keep it on-brand and within the caps. Ensure hashtags include "fyp". EVERY point slide must have a mockup object.`;
}

