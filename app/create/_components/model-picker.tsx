"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ModelId } from "@/lib/ai/registry";

export const modelDetails: Record<string, { label: string; vendor: string; description: string }> = {
  gemini: { label: "Gemini Flash", vendor: "Google AI", description: "Model cepat & cerdas dari Google (Gratis)" },
  deepseek: { label: "DeepSeek Chat", vendor: "DeepSeek AI", description: "Reasoning & content model dari DeepSeek" },
  mimo: { label: "MIMO", vendor: "Xiaomi AI", description: "OpenAI-compatible inference engine" },
  openrouter: { label: "OpenRouter", vendor: "OpenRouter", description: "Multi-vendor AI model gateway" },
  "vour-high": { label: "Vour High", vendor: "Vour Model", description: "Kualitas terbaik, untuk hasil final" },
  "vour-lite": { label: "Vour Lite", vendor: "Vour Model", description: "Lebih cepat, untuk eksplorasi ide" },
  omniroute: { label: "Vour Model", vendor: "VourDev", description: "Model AI resmi @vourdev" },
};

/**
 * Model chooser: the line of text under the composer, the way a chat app does it.
 *
 * Text only — the label plus a one-line description, no avatar. Most sessions never
 * change the model, so it should read as a status line and only behave like a control
 * once you point at it. `dropUp` exists because it now sits at the bottom of the pane:
 * a menu opening downward would fall off the viewport.
 */
export function ModelPicker({
  models,
  model,
  onChange,
  disabled,
  dropUp = false,
}: {
  models: ModelId[];
  model: ModelId | "";
  onChange: (m: ModelId) => void;
  disabled?: boolean;
  dropUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Click-away: the old popover only closed via its own × button, so it stayed open
  // while you interacted with the rest of the page.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  const info = modelDetails[model];
  const filtered = models.filter((m) => {
    const d = modelDetails[m];
    const q = search.toLowerCase();
    return (d?.label || m).toLowerCase().includes(q) || (d?.vendor || "").toLowerCase().includes(q);
  });

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group flex w-full items-baseline gap-1.5 rounded-lg px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-muted/50 disabled:opacity-50"
      >
        <span className="shrink-0 font-medium text-foreground">
          {info?.label || model || "Pilih model"}
        </span>
        <span className="truncate text-muted-foreground/80">{info?.description}</span>
        <ChevronDown className="size-3 shrink-0 self-center text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute left-0 z-50 w-72 bg-card border border-hairline rounded-xl shadow-xl p-2 animate-in fade-in duration-150 ${
            dropUp
              ? "bottom-full mb-1.5 slide-in-from-bottom-1"
              : "top-full mt-1.5 slide-in-from-top-1"
          }`}
        >
          {models.length > 4 && (
            <div className="relative mb-1.5">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari model…"
                className="pl-8 h-8 text-xs bg-muted/20 border-hairline rounded-lg"
              />
            </div>
          )}
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {filtered.map((m) => {
              const d = modelDetails[m];
              const selected = model === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(m);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-xs text-left transition-colors ${
                    selected ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d?.label || m}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{d?.description}</div>
                  </div>
                  {selected && <Check className="size-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
