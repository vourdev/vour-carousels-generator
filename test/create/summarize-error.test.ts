import { describe, it, expect } from "vitest";
import { summarizeError } from "@/app/create/_components/utils";

/**
 * The operator runs this app to find out why a generation failed. The previous version
 * answered "Terjadi kesalahan pada sistem AI." for anything past 120 characters, which is
 * almost every real error — so the message that would have explained the failure was the
 * one thing it removed.
 */
describe("summarizeError", () => {
  it("keeps the underlying text alongside a recognised cause", () => {
    const raw =
      "Backend 502 Bad Gateway setelah 121.4s — POST /api/plan: Request dropped after " +
      "exceeding the local rate-limit queue budget maxWaitMs (120000ms) for agy/gemini-3.5-flash-high";

    const out = summarizeError(raw);

    expect(out).toContain("Antrean OmniRoute penuh");
    expect(out).toContain("maxWaitMs (120000ms)");
  });

  it("shows an unrecognised long error instead of replacing it", () => {
    const raw =
      "Backend 500 Internal Server Error setelah 3.2s — POST /api/assemble: " +
      "TypeError: Cannot read properties of undefined (reading 'slides') at assembleDeck";

    const out = summarizeError(raw);

    expect(out).toContain("Cannot read properties of undefined");
    expect(out).not.toContain("Terjadi kesalahan pada sistem AI");
  });

  it("unwraps the AI SDK retry summary to the cause it hides", () => {
    const raw =
      "Failed after 3 attempts. Last error: AI_APICallError: model is overloaded, please retry";

    expect(summarizeError(raw)).toContain("model is overloaded");
    expect(summarizeError(raw)).not.toContain("Last error:");
  });

  it("names a backend that cannot be reached, which is a config fault not a model fault", () => {
    const raw =
      "Backend tidak bisa dihubungi setelah 0.2s (fetch failed) — POST " +
      "http://vour-backend-carousels-generator-2usphl:3000/api/plan";

    const out = summarizeError(raw);

    expect(out).toContain("Backend tidak bisa dihubungi dari frontend");
    expect(out).toContain("vour-backend-carousels-generator-2usphl:3000");
  });

  it("bounds a very long message rather than pasting a whole page", () => {
    const out = summarizeError("x".repeat(5000));
    expect(out.length).toBeLessThanOrEqual(301);
    expect(out.endsWith("…")).toBe(true);
  });

  it("returns a short message unchanged", () => {
    expect(summarizeError("Judul wajib diisi")).toBe("Judul wajib diisi");
  });

  it("does not answer with an empty string", () => {
    expect(summarizeError("   ")).toBe("Terjadi kesalahan tanpa keterangan.");
  });
});
