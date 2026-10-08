"use client";

import { Download, FileArchive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The exported JPEGs, shown once there is at least one. */
export function ExportPanel({
  images,
  pending,
  expectedCount,
  canDownload,
  zipping,
  onDownloadAll,
  onDownloadOne,
}: {
  images: string[];
  pending: boolean;
  expectedCount: number;
  canDownload: boolean;
  /** Building the archive: every slide is being fetched back before it can be zipped. */
  zipping: boolean;
  onDownloadAll: () => void;
  /** Save one slide. A plain download link cannot: see lib/export/download.ts. */
  onDownloadOne: (index: number) => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-hairline shrink-0">
        <span className="text-xs text-foreground/60 truncate">
          {pending
            ? `Merender ${expectedCount || "…"} slide jadi gambar…`
            : `${images.length} gambar siap diunduh`}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onDownloadAll}
          disabled={!canDownload || zipping}
          className="h-7 text-[11px] gap-1.5 px-2.5 shrink-0"
        >
          {zipping ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileArchive className="size-3.5" />
          )}
          {zipping ? "Menyiapkan…" : "Unduh semua (.zip)"}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {pending &&
            Array.from({ length: Math.max(expectedCount, 4) }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="aspect-[4/5] rounded-lg border border-hairline bg-muted/50 animate-pulse"
              />
            ))}

          {!pending &&
            images.map((src, i) => (
              <figure key={i} className="flex flex-col gap-1.5 group">
                <div className="aspect-[4/5] rounded-lg border border-hairline overflow-hidden bg-muted relative">
                  <img
                    src={src}
                    alt={`Slide ${i + 1}`}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onDownloadOne(i)}
                    aria-label={`Unduh slide ${i + 1}`}
                    className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 text-white text-[11px] font-medium opacity-0 backdrop-blur-[1px] transition-opacity duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Download className="size-3.5" />
                    Unduh
                  </button>
                </div>
                <figcaption className="text-[10px] text-center text-foreground/55 tabular-nums">
                  Slide {i + 1}
                </figcaption>
              </figure>
            ))}
        </div>

        {!pending && images.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-foreground/60 text-center px-6 py-10">
            Belum ada gambar. Render slide dulu, lalu ekspor.
          </div>
        )}

        {pending && (
          <p className="flex items-center justify-center gap-2 text-[11px] text-foreground/60 pt-4">
            <Loader2 className="size-3.5 animate-spin" />
            Boleh pindah tab, proses tetap jalan.
          </p>
        )}
      </div>
    </div>
  );
}
