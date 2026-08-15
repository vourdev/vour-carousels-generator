"use client";

import { Upload } from "lucide-react";
import { toast } from "sonner";
import type { SlidePlan } from "@/lib/ds/schema";

/**
 * Crop an uploaded screenshot to the slide's target ratio and inline it as a data URL.
 * Kept client-side so evidence never leaves the machine before the user exports.
 */
export function processUploadedScreenshot(file: File, cropRatio = "4:5"): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas context not available"));
        return;
      }

      let targetRatio = 4 / 5;
      if (cropRatio === "1:1") targetRatio = 1;
      else if (cropRatio === "16:9") targetRatio = 16 / 9;

      let srcWidth = img.width;
      let srcHeight = img.height;
      let srcX = 0;
      let srcY = 0;

      const currentRatio = srcWidth / srcHeight;
      if (currentRatio > targetRatio) {
        srcWidth = srcHeight * targetRatio;
        srcX = (img.width - srcWidth) / 2;
      } else {
        srcHeight = srcWidth / targetRatio;
        srcY = (img.height - srcHeight) / 2;
      }

      const outWidth = 1080;
      const outHeight = Math.round(outWidth / targetRatio);
      canvas.width = outWidth;
      canvas.height = outHeight;

      ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, outWidth, outHeight);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = (e) => reject(e);
  });
}

/**
 * Evidence uploader for slides whose mockup is a real screenshot.
 *
 * Only rendered when the plan actually contains such a slide — this is one of the
 * panels that used to be visible regardless of whether it applied.
 */
export function ScreenshotUploads({
  plan,
  onUpdate,
}: {
  plan: SlidePlan;
  onUpdate: (slideIndex: number, dataUrl: string) => void;
}) {
  const targets = plan.slides
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => s.role === "point" && s.mockup?.type === "screenshot");

  if (targets.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-muted/20 border border-hairline rounded-xl">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Upload className="size-3.5 text-primary" />
          Screenshot asli dibutuhkan ({targets.length} slide)
        </span>
        <span className="text-[11px] text-muted-foreground">
          Gambar dikecilkan dan ditempel langsung ke slide, jadi ekspor tetap jalan tanpa internet.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {targets.map(({ s, idx }) => {
          if (s.role !== "point" || s.mockup?.type !== "screenshot") return null;
          const m = s.mockup;
          const status = m.evidenceStatus || "pending";
          const shotBrief = m.screenshotBrief;

          const upload = async (file: File | undefined) => {
            if (!file) return;
            try {
              const dataUrl = await processUploadedScreenshot(file, shotBrief?.cropRatio || "4:5");
              onUpdate(idx, dataUrl);
              toast.success(`Screenshot slide ${idx + 1} tersimpan`);
            } catch {
              toast.error("Gagal memproses gambar");
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
                    Ganti gambar
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </label>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-primary/40 hover:border-primary rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-medium text-primary">
                  <Upload className="size-3.5" />
                  <span>Unggah screenshot slide {idx + 1}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
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
