"use client";

import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A deck's cover at list size. Falls back to an empty tile when the image is missing or
 * its host does not answer — the slide CDN can be down, or the asset cleaned up — so a
 * list shows a quiet gap instead of a row of broken-image icons.
 */
export function Thumb({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  // A server-rendered <img> can fail before React hydrates and attaches onError, so the
  // error event is never seen. Check on attach: complete with no pixels means it failed.
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <span
      className={cn("block aspect-4/5 w-8 shrink-0 overflow-hidden rounded border border-border bg-muted", className)}
    >
      {src && !failed ? (
        // biome-ignore lint/performance/noImgElement: remote slide URLs on hosts next/image is not configured for
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={ref} src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : null}
    </span>
  );
}
