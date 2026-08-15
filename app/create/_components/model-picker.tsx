"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ModelId } from "@/lib/ai/registry";

const VourLogoIcon = () => (
  <img src="/vourdev-logo.jpeg" alt="Vour" className="size-4 rounded-full object-cover shrink-0 border border-hairline" />
);

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
 * Model chooser, reduced to a quiet header control.
 *
 * It used to sit inside the chat sidebar header where it competed with the session
 * status for attention. Most sessions never change the model, so it now reads as a
 * label until you click it.
 */
export function ModelPicker({
  models,
  model,
  onChange,
  disabled,
}: {
  models: ModelId[];
  model: ModelId | "";
  onChange: (m: ModelId) => void;
  disabled?: boolean;
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
      >
        <VourLogoIcon />
        <span className="font-medium truncate max-w-[110px]">{info?.label || model || "Pilih model"}</span>
        <ChevronDown className="size-3 opacity-60" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-card border border-hairline rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-1 duration-150"
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
