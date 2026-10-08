"use client";

import { useDeferredValue, useMemo } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { renderMarkdown } from "./markdown";

export type MdMode = "split" | "editor" | "preview";

const MODES: { id: MdMode; label: string }[] = [
  { id: "preview", label: "Rapi" },
  { id: "editor", label: "Teks" },
  { id: "split", label: "Dua kolom" },
];

/**
 * Brief outline editor.
 *
 * The mode labels are deliberately plain Indonesian rather than "Split View / Raw
 * Editor / Formatted Preview" — this is the screen a non-technical user meets first,
 * and "Raw Editor" tells them nothing about what they would see.
 */
export function BriefEditor({
  brief,
  onChange,
  mode,
  onModeChange,
  disabled,
  onPolish,
  polishDisabled,
}: {
  brief: string;
  onChange: (v: string) => void;
  mode: MdMode;
  onModeChange: (m: MdMode) => void;
  disabled?: boolean;
  onPolish: () => void;
  polishDisabled?: boolean;
}) {
  // renderMarkdown walks the brief line by line. During the reveal it would re-parse
  // ~66 times a second, and while typing it re-parses on every keystroke. Deferring
  // keeps the textarea responsive and lets React drop intermediate parses; the memo
  // then avoids repeating work for a value it has already rendered.
  const deferredBrief = useDeferredValue(brief);
  const preview = useMemo(() => renderMarkdown(deferredBrief), [deferredBrief]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-hairline shrink-0">
        <div className="inline-flex p-0.5 bg-muted/50 rounded-lg border border-hairline">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                mode === m.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={polishDisabled}
          onClick={onPolish}
          title="Tulis ulang brief agar terdengar lebih manusiawi"
          className="h-7 text-[11px] gap-1.5 px-2.5 text-primary hover:bg-primary/5"
        >
          <User className="size-3.5" />
          Perhalus bahasa
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-canvas-soft">
        {mode === "editor" && (
          <Textarea
            value={brief}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="# Judul Carousel…"
            className="font-mono text-xs h-full w-full p-4 bg-transparent border-none resize-none focus-visible:ring-0 leading-relaxed overflow-y-auto"
          />
        )}

        {mode === "preview" && (
          <div className="h-full w-full p-5 overflow-y-auto bg-card">
            {brief ? preview : <EmptyBrief />}
          </div>
        )}

        {mode === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 h-full divide-y md:divide-y-0 md:divide-x divide-hairline overflow-hidden">
            <Textarea
              value={brief}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder="# Judul Carousel…"
              className="font-mono text-xs h-full w-full p-4 bg-transparent border-none resize-none focus-visible:ring-0 leading-relaxed overflow-y-auto"
            />
            <div className="h-full w-full p-5 overflow-y-auto bg-card/60">
              {brief ? preview : <EmptyBrief />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyBrief() {
  return (
    <div className="h-full flex items-center justify-center text-xs text-muted-foreground text-center px-6">
      Brief masih kosong. Ketik ide carousel di kolom chat untuk membuatnya.
    </div>
  );
}
