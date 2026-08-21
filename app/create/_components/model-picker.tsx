"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ModelId } from "@/lib/models";

export const modelDetails: Record<string, { label: string; description: string }> = {
  "vour-lite": { 
    label: "Sonnet 4.5", 
    description: "Paling efisien untuk tugas pembuatan carousel sehari-hari" 
  },
  "vour-high": { 
    label: "Opus 4.6", 
    description: "Kualitas penulisan terbaik dengan penalaran dan analisis mendalam" 
  },
};

export function ModelPicker({
  model,
  onChange,
  disabled,
}: {
  models?: ModelId[];
  model: ModelId | "";
  onChange: (m: ModelId) => void;
  disabled?: boolean;
  dropUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-away to close menu
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Resolve active label
  const activeModelId = model === "vour-high" ? "vour-high" : "vour-lite";
  const activeLabel = modelDetails[activeModelId]?.label ?? "Sonnet 4.5";

  return (
    <div className="relative" ref={ref}>
      {/* Pill button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all text-xs font-medium text-foreground bg-muted/40 hover:bg-muted border border-hairline/60 disabled:opacity-50 select-none cursor-pointer active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <span className="font-medium text-foreground">{activeLabel}</span>
        <ChevronDown className="size-3 text-muted-foreground stroke-[2.5]" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute bottom-full right-0 mb-2 z-50 w-80 bg-card/95 border border-hairline rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden"
        >
          <div className="space-y-1">
            {/* Vour Lite -> Sonnet 4.5 Row */}
            <button
              type="button"
              className={`w-full flex items-start justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
                activeModelId === "vour-lite"
                  ? "bg-primary/10 border border-primary/20 text-foreground"
                  : "hover:bg-muted/70 text-foreground"
              }`}
              onClick={() => {
                onChange("vour-lite");
                setOpen(false);
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  {modelDetails["vour-lite"].label}
                  {activeModelId === "vour-lite" && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/15 text-primary font-medium">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mt-1">
                  {modelDetails["vour-lite"].description}
                </div>
              </div>
              {activeModelId === "vour-lite" && (
                <Check className="size-4 shrink-0 text-primary stroke-[2.5] mt-0.5" />
              )}
            </button>

            {/* Vour High -> Opus 4.6 Row */}
            <button
              type="button"
              className={`w-full flex items-start justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
                activeModelId === "vour-high"
                  ? "bg-primary/10 border border-primary/20 text-foreground"
                  : "hover:bg-muted/70 text-foreground"
              }`}
              onClick={() => {
                onChange("vour-high");
                setOpen(false);
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  {modelDetails["vour-high"].label}
                  {activeModelId === "vour-high" && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/15 text-primary font-medium">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mt-1">
                  {modelDetails["vour-high"].description}
                </div>
              </div>
              {activeModelId === "vour-high" && (
                <Check className="size-4 shrink-0 text-primary stroke-[2.5] mt-0.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
