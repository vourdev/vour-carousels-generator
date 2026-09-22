"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ModelId } from "@/lib/models";

export const modelDetails: Record<string, { label: string; description: string }> = {
  "vour-high": {
    label: "Opus 4.6",
    description: "Kualitas penulisan terbaik dengan penalaran dan analisis mendalam"
  },
  // "vour-lite" (Sonnet 4.5) is gone: the OmniRoute combo behind it, `vour-learning`, was
  // deleted on 22 Sep 2026 and every generation that picked it answered
  // `400 Unable to determine provider`. The backend no longer offers it, and this list now
  // follows the backend instead of asserting what exists.
};

/**
 * The rows are whatever the backend says is usable.
 *
 * `models` was a declared prop that nothing read: the two rows were written out by hand, so
 * the dropdown kept offering a model the backend had stopped serving and the failure only
 * surfaced as a 400 mid-generation. Anything the backend reports without an entry in
 * `modelDetails` still renders, under its own id.
 */
export function ModelPicker({
  models,
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

  // Retired ids still resolve on the backend so saved carousels open, but they must never be
  // offered as a choice again.
  const RETIRED: ModelId[] = ["vour-lite", "gemini"];
  const offered: ModelId[] = models?.length ? models : ["vour-high"];
  const choices: ModelId[] = offered.filter((m) => !RETIRED.includes(m));
  const activeModelId = model && choices.includes(model) ? model : choices[0];
  const activeLabel = modelDetails[activeModelId]?.label ?? activeModelId;

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
          className="absolute bottom-full right-0 mb-2 z-50 w-80 bg-card border border-hairline rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden"
        >
          <div className="space-y-1">
            {choices.map((id) => (
              <button
                key={id}
                type="button"
                className={`w-full flex items-start justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${activeModelId === id
                  ? "bg-primary/10 border border-primary/20 text-foreground"
                  : "hover:bg-muted/70 text-foreground"
                  }`}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                    {modelDetails[id]?.label ?? id}
                  </div>
                  {modelDetails[id]?.description && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {modelDetails[id].description}
                    </div>
                  )}
                </div>
                {activeModelId === id && (
                  <Check className="size-4 shrink-0 text-primary stroke-[2.5] mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
