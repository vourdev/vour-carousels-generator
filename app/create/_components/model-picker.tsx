"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ModelId } from "@/lib/models";

export const modelDetails: Record<string, { label: string; description: string }> = {
  "vour-lite": { 
    label: "Sonnet 4.5", 
    description: "Paling efisien untuk tugas sehari-hari" 
  },
  "vour-high": { 
    label: "Opus 4.6", 
    description: "Kualitas penulisan terbaik dan analisis mendalam" 
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
  const activeLabel = modelDetails[activeModelId].label;

  return (
    <div className="relative" ref={ref}>
      {/* Pill button matching the design in Image 1 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all text-xs font-normal text-foreground disabled:opacity-50 select-none cursor-pointer active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/20"
      >
        <span className="font-medium text-zinc-900 dark:text-zinc-150">{activeLabel}</span>
        <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500 stroke-[2.5]" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute bottom-full right-0 mb-2.5 z-50 w-72 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/60 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="space-y-0.5">
            {/* Vour Lite -> Sonnet 4.5 Row */}
            <button
              type="button"
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
                activeModelId === "vour-lite" ? "bg-zinc-50/70 dark:bg-zinc-800/20" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
              onClick={() => {
                onChange("vour-lite");
                setOpen(false);
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[13px] text-zinc-900 dark:text-zinc-100">
                  {modelDetails["vour-lite"].label}
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal mt-0.5 wrap-break-word">
                  {modelDetails["vour-lite"].description}
                </div>
              </div>
              {activeModelId === "vour-lite" && (
                <Check className="size-4 shrink-0 text-blue-500 stroke-[2.5]" />
              )}
            </button>

            {/* Vour High -> Opus 4.6 Row */}
            <button
              type="button"
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
                activeModelId === "vour-high" ? "bg-zinc-50/70 dark:bg-zinc-800/20" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
              onClick={() => {
                onChange("vour-high");
                setOpen(false);
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[13px] text-zinc-900 dark:text-zinc-100">
                  {modelDetails["vour-high"].label}
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal mt-0.5 wrap-break-word">
                  {modelDetails["vour-high"].description}
                </div>
              </div>
              {activeModelId === "vour-high" && (
                <Check className="size-4 shrink-0 text-blue-500 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
