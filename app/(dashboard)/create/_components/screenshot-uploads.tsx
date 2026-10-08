"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SlidePlan } from "@/lib/ds/schema";
import { evidenceUploadAction, type EvidenceAttempt } from "../actions";

/** Read a picked file as a data URL. Shaping it is the backend's job, not this one's. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("file could not be read"));
    reader.readAsDataURL(file);
  });
}

/** Server Actions are capped at 10 MB in next.config; refuse before the round trip. */
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Why the backend could not fill this slide by itself, in the operator's language.
 *
 * Every one of these ends the same way — the slide is empty and a person has to supply
 * the picture — but which one it was decides what they should do about it: a wrong or
 * missing site is a brief problem, a rejected shot is usually a page that needs a login.
 */
const REASON_COPY: Record<string, string> = {
  "no-search": "Web search tidak aktif, jadi URL resminya tidak bisa dipastikan.",
  "no-answer": "Web search tidak mengembalikan jawaban.",
  unparseable: "Jawaban pencarian tidak bisa dibaca.",
  "low-confidence": "Hasil pencarian tidak cukup yakin soal situs resminya.",
  "not-https": "Situs yang ditemukan tidak pakai HTTPS.",
  uncorroborated: "Domain yang diusulkan tidak didukung hasil pencarian — tidak dipotret.",
  aggregator: "Yang ketemu cuma Wikipedia/Reddit, bukan situs resmi.",
  "mostly-blank": "Halaman ter-capture nyaris kosong — kemungkinan gagal load atau butuh login.",
  "flat-overlay": "Hasilnya satu blok warna rata — kemungkinan overlay atau halaman belum render.",
  "too-small": "Hasil capture terlalu kecil untuk jadi bukti.",
  "no-detail": "Hasil capture nyaris tanpa detail.",
};

function explain(attempt: EvidenceAttempt | undefined): string | null {
  if (!attempt || attempt.outcome === "captured") return null;
  const known = attempt.reason ? REASON_COPY[attempt.reason] : undefined;
  if (known) return known;
  if (attempt.outcome === "error") return `Gagal memotret: ${attempt.reason ?? "halaman tidak bisa dibuka"}.`;
  return "Screenshot otomatis tidak berhasil.";
}

/**
 * Evidence uploader for slides whose mockup is a real screenshot.
 *
 * The backend tries to fill these on its own — it resolves the official URL from a web
 * search, photographs the page and keeps the shot only if it passes an automated quality
 * check. This panel is what happens when that does not work: it names the slide, says why
 * the automatic attempt failed, and takes the file.
 *
 * Only rendered when the plan actually contains such a slide.
 */
export function ScreenshotUploads({
  plan,
  attempts = [],
  onUpdate,
}: {
  plan: SlidePlan;
  /** Automatic-capture results from /api/plan, keyed to slides by `slideIndex`. */
  attempts?: EvidenceAttempt[];
  onUpdate: (slideIndex: number, dataUrl: string) => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);

  const targets = plan.slides
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => s.role === "point" && s.mockup?.type === "screenshot");

  if (targets.length === 0) return null;

  const pending = targets.filter(
    ({ s }) => s.role === "point" && s.mockup?.type === "screenshot" && !s.mockup.screenshotImage?.dataUrl
  ).length;

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-muted/20 border border-hairline rounded-xl">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Upload className="size-3.5 text-primary" />
          Screenshot asli dibutuhkan ({pending} dari {targets.length} slide)
        </span>
        <span className="text-[11px] text-muted-foreground">
          Dipotong ke rasio slide di server, lalu ditempel langsung ke slide — ekspor tetap jalan tanpa internet.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {targets.map(({ s, idx }) => {
          if (s.role !== "point" || s.mockup?.type !== "screenshot") return null;
          const m = s.mockup;
          const status = m.evidenceStatus || "pending";
          const shotBrief = m.screenshotBrief;
          const attempt = attempts.find((a) => a.slideIndex === idx);
          const failure = m.screenshotImage?.dataUrl ? null : explain(attempt);
          const uploading = busy === idx;

          const upload = async (file: File | undefined) => {
            if (!file) return;
            if (file.size > MAX_FILE_BYTES) {
              toast.error("Gambar terlalu besar (maksimal 8 MB).");
              return;
            }
            setBusy(idx);
            try {
              const dataUrl = await fileToDataUrl(file);
              const shaped = await evidenceUploadAction({
                dataUrl,
                cropRatio: shotBrief?.cropRatio || "4:5",
                slideIndex: idx,
                source: shotBrief?.source,
              });
              onUpdate(idx, shaped.dataUrl);
              if (shaped.warning) {
                toast.warning(
                  shaped.warning === "mostly-blank"
                    ? `Slide ${idx + 1}: gambarnya nyaris kosong — cek lagi kalau salah file.`
                    : `Slide ${idx + 1}: gambarnya satu blok warna rata — cek lagi kalau salah file.`
                );
              } else {
                toast.success(`Screenshot slide ${idx + 1} tersimpan`);
              }
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Gagal memproses gambar");
            } finally {
              setBusy(null);
            }
          };

          return (
            <div key={idx} className="p-3 bg-card border border-hairline rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground truncate">
                  Slide {idx + 1}: {s.headline || "Bukti screenshot"}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                    status === "captured"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : status === "fallback_used"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                  }`}
                >
                  {status === "captured" ? "Ada" : status === "fallback_used" ? "Teks" : "Belum"}
                </span>
              </div>

              {failure && (
                <div className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 rounded">
                  <span className="font-semibold">Auto-capture gagal.</span> {failure}
                  {attempt?.host && <span className="font-mono"> ({attempt.host})</span>}
                </div>
              )}

              {shotBrief && (
                <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5 bg-muted/40 p-2 rounded">
                  <div>Sumber: {shotBrief.source || "Aplikasi / tool"}</div>
                  <div>Harus terlihat: {shotBrief.mustShow || "-"}</div>
                  <div>Harus disensor: {shotBrief.mustHide || "-"}</div>
                </div>
              )}

              {m.screenshotImage?.dataUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={m.screenshotImage.dataUrl}
                    alt={`Screenshot slide ${idx + 1}`}
                    className="size-12 object-cover rounded border border-hairline"
                  />
                  <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
                    {uploading ? "Memproses…" : "Ganti gambar"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </label>
                </div>
              ) : (
                <label
                  className={`flex items-center justify-center gap-2 p-2.5 border border-dashed rounded-lg text-xs font-medium transition-colors ${
                    uploading
                      ? "border-hairline text-muted-foreground cursor-wait"
                      : "border-primary/40 hover:border-primary cursor-pointer bg-primary/5 hover:bg-primary/10 text-primary"
                  }`}
                >
                  {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                  <span>{uploading ? "Memproses gambar…" : `Unggah screenshot slide ${idx + 1}`}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => upload(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
