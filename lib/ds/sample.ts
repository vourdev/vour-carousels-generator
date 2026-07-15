import type { SlidePlan } from "@/lib/ds/schema";

export const samplePlan: SlidePlan = {
  title: "Idempotency di API — Konsep Dasar",
  caption: "Kenapa retry aman kalau API-mu idempotent.\n\nSimpan biar nggak lupa!",
  hashtags: ["backend", "api", "idempotency", "vourdev"],
  slides: [
    {
      role: "cover",
      eyebrow: "BACKEND 101",
      headline: "Idempotency itu wajib",
      accentWord: "Idempotency",
      lede: "Biar retry nggak bikin data dobel.",
    },
    {
      role: "point",
      counter: "02 / 03",
      eyebrow: "KENAPA",
      headline: "Retry itu normal",
      accentWord: "Retry",
      body: "Network gagal, client ulang request. Tanpa idempotency, satu aksi kejadian dua kali.",
      card: {
        icon: "lucide:repeat",
        title: "Retry-safe",
        body: "Request sama → hasil sama.",
        tone: "peach",
      },
    },
    {
      role: "outro",
      headline: "Follow @vourdev",
      accentWord: "@vourdev",
      body: "Konten backend tiap minggu.",
    },
  ],
};
