/**
 * Vour brand palette.
 *
 * Extracted from the logo: black, white, and two teals, plus ONE warm accent added
 * deliberately (see the amber block). Everything the carousels paint resolves to one of
 * these or to a tint derived from them — there is no second palette, and the model
 * never picks a colour.
 *
 * Contrast ratios below are measured (WCAG 2.1 relative luminance), not estimated.
 * Carousels are scrolled past in a second, so accent text is held to the AA body
 * threshold (4.5:1) even where it is set at display size and only needs 3:1.
 */

/* ── Core ─────────────────────────────────────────────────────────────────── */

/** Logo black. Deck background on the darkest slides, body text on light ones. */
export const VOUR_BLACK = "#000000";

/**
 * Dark surface with a teal tint. Pure black on every dark slide reads as an absence
 * of design; this is the panel/alternate dark so the dark family has depth.
 */
export const VOUR_CHARCOAL = "#0D1414";

/** Logo teal. Accent on dark surfaces — 12.6:1 on black, 11.2:1 on charcoal. */
export const VOUR_TEAL = "#50DCDC";

/** Logo teal, brighter/cyan-leaning. Highlight accent on dark — 13.4:1 on black. */
export const VOUR_TEAL_BRIGHT = "#4DE1F3";

/**
 * Accent used for TEXT on dark surfaces (headline accent word, eyebrow).
 *
 * VOUR_TEAL is right for chrome — borders, chips, nodes, the illustration accent — but
 * wrong for copy. Measured on logo black: the headline is 21:1, body text is 9.8:1
 * (72% white), and VOUR_TEAL is 12.6:1. That makes the accent word BRIGHTER than the
 * body it is supposed to serve — 1.29x — so the eye lands on the accent instead of on
 * the sentence. Under the previous palette the same relationship was 0.76x: the accent
 * was dimmer than the body and read as a highlight inside the headline, not as a rival
 * to it.
 *
 * #3BB3B3 is 8.3:1 on black, which restores that ordering at 0.84x while staying well
 * above AA and unmistakably the same hue as the logo.
 */
export const VOUR_TEAL_TEXT = "#3BB3B3";

/**
 * Accent on LIGHT surfaces.
 *
 * The logo teals are far too light to sit on white: #50DCDC is 1.7:1 there. This is
 * the same hue taken down in lightness until it passes AA on both light surfaces.
 * Measured against the three candidates considered:
 *
 *   #1A9999 → 3.47:1 on white, 3.20:1 on mist  — fails AA outright
 *   #157F7F → 4.80:1 on white, 4.44:1 on mist  — fails AA on mist, the surface it
 *                                                sits on most often
 *   #0F6666 → 6.75:1 on white, 6.24:1 on mist  — chosen
 */
export const VOUR_TEAL_DEEP = "#0F6666";

/** Logo white. Deck background on light slides, body text on dark ones. */
export const VOUR_WHITE = "#FFFFFF";

/** Light surface with a teal tint — the light counterpart to VOUR_CHARCOAL. */
export const VOUR_MIST = "#F2F7F7";

/**
 * Second light surface: warm cream, the paper stock to Mist's cool sheet.
 *
 * Added to give the light half of the deck the same two-way rhythm the dark half has
 * had since the rebrand (black / charcoal). Deliberately a touch LIGHTER than Mist
 * (L 0.924 vs 0.921) so it can never become the binding surface for a contrast check —
 * every value already cleared against Mist clears here too:
 *
 *   black    19.48:1   ·   slate #223131   12.56:1
 *   teal deep 6.26:1   ·   amber deep       4.77:1
 *
 * Which paper a slide gets is decided by the renderer, not the model. See the comment
 * on the .paper.warm rule in carousel-css-extra.ts.
 */
export const VOUR_PAPER = "#FAF6EE";

/* ── Amber: the one warm accent ───────────────────────────────────────────────
 * A deck built from teal, black and white reads as a newspaper: correct, legible, and
 * tonally flat. A magazine gets its life from a second colour used sparingly and in
 * SOLID blocks. This is that colour, and it is deliberately the only one — a third
 * would turn a two-colour system into "whatever the slide felt like".
 *
 * Its roles are fixed and enumerated (numbered badge, pull-quote mark). It is NOT for
 * the headline accent word: that stays teal, because splitting the primary accent
 * across two hues is how a brand stops having one.
 *
 * Two values for the same reason teal has two — measured, not assumed:
 *
 *              white   mist    black   charcoal
 *   #E8A33D     2.16    1.99    9.74     8.64
 *   #94640A     4.87    4.75    4.09     3.63
 *
 * So amber cannot be a single value: #E8A33D is unusable on light (it fails even the
 * 3:1 a filled block needs against Mist, let alone 4.5:1 for text), and #94640A is the
 * dull one on dark. Each surface gets the value that works there.
 */

/** Amber on DARK surfaces — text and solid fills. 9.7:1 on black; ink glyphs on top of
 *  it are also 9.7:1, so a solid amber badge takes black numerals, never white. */
export const VOUR_AMBER = "#E8A33D";

/** Amber on LIGHT surfaces — text and solid fills. 4.75:1 on Mist, 4.77:1 on Cream, and
 *  white text on top of it is 5.14:1, so a solid badge here takes WHITE numerals.
 *  Chosen over #986802 (4.50 on Mist — no margin) and #9A6410 (4.62). */
export const VOUR_AMBER_DEEP = "#94640A";

/** Pale amber panel tint for light surfaces — the warm sibling of the aqua card tone.
 *  Black 17.5:1 and slate 11.3:1 on it. Amber deep is 4.29:1 on it: fine for the
 *  decorative quote mark (3:1), NOT for text, so copy on this panel stays neutral. */
export const VOUR_AMBER_WASH = "#F7E9CF";

/* ── Derived neutrals ─────────────────────────────────────────────────────────
 * Every step is the brand hue (180°) desaturated, so the greys read as part of the
 * palette rather than as generic UI grey. */

/** Muted body text on light surfaces — 12.0:1 on mist. */
export const VOUR_SLATE = "#223131";
/** Secondary text on light surfaces. */
export const VOUR_SLATE_SOFT = "#4A5C5C";
/** Faint text / captions on light surfaces. */
export const VOUR_SLATE_FAINT = "#7E9494";
/** Hairlines and borders on light surfaces. */
export const VOUR_LINE_LIGHT = "rgba(0, 0, 0, 0.14)";

/** Panel on dark surfaces, one step up from charcoal. */
export const VOUR_INK_PANEL = "#162020";
/** Muted body text on dark surfaces. */
export const VOUR_MIST_MUTED = "rgba(242, 247, 247, 0.72)";
/** Faint text on dark surfaces. */
export const VOUR_MIST_FAINT = "rgba(242, 247, 247, 0.45)";
/** Hairlines and borders on dark surfaces. */
export const VOUR_LINE_DARK = "rgba(242, 247, 247, 0.16)";

/* ── Tonal family ─────────────────────────────────────────────────────────────
 * Six pastel card/step tones. They exist to keep a deck from looking monotone, so
 * they stay six distinct hues — collapsing them all to teal would solve brand
 * consistency by reintroducing the sameness this deck was built to avoid.
 *
 * All six sit in the cool half of the wheel (roughly 165°-260°), which is what keeps
 * them in the logo's family. None of them is warm, so nothing here can read as the
 * orange the brand is moving away from. */
export const VOUR_TONES = {
  /** neutral / default */
  aqua: { bg: "#E2F4F4", ink: "#0F6666" },
  /** loser / scraped — deliberately the least saturated, so it reads as the dead one */
  stone: { bg: "#E4E9E9", ink: "#556666" },
  /** success */
  mint: { bg: "#DDF2E9", ink: "#16705A" },
  /** tooling / info */
  sky: { bg: "#DCEAF6", ink: "#245F8F" },
  /** design */
  iris: { bg: "#E6E2F7", ink: "#5C5CA8" },
  /** highlight / performance */
  cyan: { bg: "#D9F1F7", ink: "#0B6070" },
} as const;

export type VourTone = keyof typeof VOUR_TONES;

/* ── Semantic pairs ───────────────────────────────────────────────────────────
 * The deck marks wrong-vs-right in several places (comparison panels, ✗/✓ rows, NOC
 * up/down). Red is out of the palette, so "wrong" is carried by desaturation instead
 * of by hue: the failing side goes flat grey-teal while the passing side keeps
 * saturation. The glyph (✗ / ✓) still does the primary work, as it always did. */
export const VOUR_NEGATIVE = "#607272";
export const VOUR_POSITIVE = "#16705A";
/** Brighter pair for dark surfaces. */
export const VOUR_NEGATIVE_ON_DARK = "#8FA5A5";
export const VOUR_POSITIVE_ON_DARK = "#3FD8A8";

/* ── Terminal syntax ──────────────────────────────────────────────────────────
 * A code block needs several distinguishable colours. These are picked inside the
 * cool range and checked against the terminal's own #0D1414 body. */
export const VOUR_CODE = {
  key: "#4DE1F3",
  val: "#9FB4FF",
  str: "#9FB4FF",
  num: "#3FD8A8",
  kw: "#50DCDC",
  cmt: "rgba(242, 247, 247, 0.42)",
} as const;
