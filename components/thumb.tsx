"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A deck's cover at list size. Falls back to an empty tile when the image is missing or
 * its host does not answer — the slide CDN can be down, or the asset cleaned up — so a
 * list shows a quiet gap instead of a row of broken-image icons.
 */
export function Thumb({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn(
        "block aspect-4/5 w-8 shrink-0 overflow-hidden rounded border border-border bg-muted",
        className
      )}
    >
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : null}
    </span>
  );
}
