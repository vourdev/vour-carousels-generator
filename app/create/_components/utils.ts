/**
 * Pure helpers shared by the create-studio components. Kept free of JSX and of React
 * so they can be unit-tested directly — the reveal maths in particular is the only
 * genuinely testable part of the background-tab fix.
 */

/**
 * Turn a raw error into something readable — without throwing away what it said.
 *
 * This used to answer "Terjadi kesalahan pada sistem AI." for anything longer than 120
 * characters, which covered almost every real failure. The operator was told that
 * something broke and never what, so every incident started by opening server logs. Now
 * a recognised cause gets a plain-language headline AND keeps the underlying text, and
 * an unrecognised one is shown rather than replaced.
 */
const KNOWN_CAUSES: ReadonlyArray<[RegExp, string]> = [
  [
    /queue budget|maxwaitms|requestqueue/i,
    "Antrean OmniRoute penuh — permintaan menunggu terlalu lama sebelum dapat giliran.",
  ],
  [
    /quota exceeded|exceeded your current quota|rate limit|rate-limits/i,
    "Batas kuota model terlampaui (rate limit).",
  ],
  [/high demand|experiencing high demand/i, "Model sedang sibuk karena permintaan tinggi."],
  [
    /invalid api key|api key not valid|api_key|unauthorized|401/i,
    "Kredensial ke layanan model ditolak — periksa API key.",
  ],
  [/no longer available|not available|model not found/i, "Model yang dipilih tidak tersedia."],
  [
    /tidak bisa dihubungi|econnrefused|enotfound|fetch failed/i,
    "Backend tidak bisa dihubungi dari frontend — layanan mati atau alamat internalnya salah.",
  ],
  [/tidak menjawab dalam|timeout|etimedout|aborted/i, "Backend tidak menjawab sampai batas waktu."],
  [/502|503|504|bad gateway|gateway timeout/i, "Gateway menolak atau memutus permintaan."],
];

/** The most informative part of a long message, whitespace-collapsed and bounded. */
function condense(msg: string): string {
  let out = msg.trim();

  // AI SDK wraps its real cause behind a retry summary; the tail is the useful half.
  const last = out.lastIndexOf("Last error: ");
  if (last !== -1) out = out.slice(last + "Last error: ".length);

  out = out.replace(/^AI_APICallError:\s*/i, "").replace(/\s+/g, " ").trim();
  return out.length > 300 ? `${out.slice(0, 300)}…` : out;
}

export function summarizeError(msg: string): string {
  const detail = condense(msg);
  if (!detail) return "Terjadi kesalahan tanpa keterangan.";

  const hit = KNOWN_CAUSES.find(([re]) => re.test(msg));
  if (!hit) return detail;

  // Do not repeat the detail when the headline already is the message.
  return detail === hit[1] ? detail : `${hit[1]} — ${detail}`;
}

/** Read the vourdev-meta block (title/caption/hashtags) from an uploaded HTML carousel. */
export function parseMeta(html: string): { title: string; caption: string; hashtags: string[] } {
  const m = html.match(/<script[^>]*id="vourdev-meta"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    try {
      const j = JSON.parse(m[1]);
      return {
        title: typeof j.title === "string" ? j.title : "Untitled",
        caption: typeof j.caption === "string" ? j.caption : "",
        hashtags: Array.isArray(j.hashtags) ? j.hashtags : [],
      };
    } catch {
      // fall through
    }
  }
  return { title: "Untitled", caption: "", hashtags: [] };
}

export function countSections(html: string): number {
  return (html.match(/<section[\s>]/g) ?? []).length;
}

/* ── Brief reveal timing ─────────────────────────────────────────────────────
 * The brief is revealed progressively as feedback that something happened. It used
 * to advance a fixed 4 characters per 15ms tick, which coupled the animation to the
 * timer firing on schedule. Browsers clamp timers in a hidden tab to >=1s and freeze
 * them entirely after a few minutes, so switching tabs stretched an 11-second reveal
 * into 12+ minutes.
 *
 * Deriving the offset from wall-clock time instead makes a late tick harmless: it
 * jumps straight to where the reveal should be by now. Same visible speed when the
 * tab is focused, no stall when it is not. */

/** Reveal rate, matched to the previous 4-characters-per-15ms feel. */
export const REVEAL_CHARS_PER_MS = 4 / 15;

/**
 * How much of the text should be visible at `now`.
 *
 * Monotonic and clamped to `[0, total]`, so a clock that jumps (throttled tab, system
 * sleep, NTP correction) can only ever land further along, never backwards.
 */
export function revealedLength(
  startedAt: number,
  now: number,
  total: number,
  charsPerMs: number = REVEAL_CHARS_PER_MS
): number {
  if (total <= 0) return 0;
  const elapsed = now - startedAt;
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  return Math.min(total, Math.floor(elapsed * charsPerMs));
}

/** Whole seconds since `startedAt` — real elapsed time, not a count of timer ticks. */
export function elapsedSeconds(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/**
 * Which phase of a multi-phase job to show, holding on the last one.
 * Derived from the clock for the same reason as the reveal: a backgrounded job must
 * not come back showing phase 1 of 4 after two minutes.
 */
export function phaseAt(startedAt: number, now: number, phaseCount: number, phaseMs = 4000): number {
  if (phaseCount <= 0) return 0;
  const elapsed = Math.max(0, now - startedAt);
  return Math.min(phaseCount - 1, Math.floor(elapsed / phaseMs));
}

/* ── Image helpers used by the export path ───────────────────────────────────── */

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

/** Downscale an exported slide for the history thumbnail, so drafts stay small. */
export function compressImageBlob(blob: Blob, maxWidth = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas context not available"));
        return;
      }
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = (e) => reject(e);
  });
}
