/**
 * Vour brand palette.
 *
 * Extracted from the logo: black, white, and two teals. Everything the carousels
 * paint resolves to one of these or to a tint derived from them — there is no second
 * palette, and no warm colour anywhere in the deck.
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
