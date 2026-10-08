import { Figtree, Geist, Geist_Mono, Inter } from "next/font/google";

/**
 * Fonts the Preferences panel offers. The admin template ships eighteen; every one is a
 * set of @font-face rules on every page, so this keeps the four that suit a dense
 * operator dashboard. Add one here and it appears in the panel and the CSS map below.
 */

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const fontRegistry = {
  geist: { label: "Geist", font: geist },
  inter: { label: "Inter", font: inter },
  figtree: { label: "Figtree", font: figtree },
  geistMono: { label: "Geist Mono", font: geistMono },
} as const;

export type FontKey = keyof typeof fontRegistry;

export const fontKeys = Object.keys(fontRegistry) as FontKey[];

export const fontVars = Object.values(fontRegistry)
  .map(({ font }) => font.variable)
  .join(" ");

export const fontOptions = fontKeys.map((key) => ({
  key,
  label: fontRegistry[key].label,
}));
