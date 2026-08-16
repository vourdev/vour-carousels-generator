"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Search, Send, Square, Plus, Mic, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Topic } from "@/lib/topics/bank";

/**
 * The single input for the whole studio.
 *
 * It used to live at the bottom of a 360px sidebar while the wide panel showed an empty
 * state pointing at it. Now it is the widest thing on the page, centred under the
 * conversation, which is where someone who has used any chat app will look first.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  onCancel,
  busy,
  canSend,
  placeholder,
  topics,
  onPickTopic,
  hint,
  modelSelector,
  footer,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onCancel: () => void;
  /** A generation is in flight — the send button becomes Stop. */
  busy: boolean;
  canSend: boolean;
  placeholder: string;
  topics: Topic[];
  onPickTopic: (t: Topic) => void;
  hint?: React.ReactNode;
  modelSelector?: React.ReactNode;
  /** Bottom-left slot under the input — where the model selector lives. */
  footer?: React.ReactNode;
}) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const attachRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!attachOpen) return;
    const onDown = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setAttachOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setAttachOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [attachOpen]);

  // Grow with the content up to a ceiling, the way every chat composer does.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const filteredTopics = topics.filter((t) =>
    t.title.toLowerCase().includes(topicSearch.toLowerCase())
  );

  return (
    <div className="shrink-0 border-t border-hairline bg-background/80 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[720px] px-4 md:px-6 py-3 flex flex-col gap-2">
        {hint}

        <div className="relative rounded-2xl border border-hairline bg-card shadow-sm focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
          <Textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="min-h-[52px] max-h-[200px] w-full resize-none border-none bg-transparent px-4 pt-3.5 pb-11 text-sm leading-relaxed shadow-none focus-visible:ring-0"
          />

          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
            <div className="relative" ref={attachRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setAttachOpen((o) => !o)}
                aria-label="Ambil topik dari Topic Bank"
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-4.5" />
              </Button>

              {attachOpen && (
                <div className="absolute left-0 bottom-full mb-2 z-50 w-80 bg-card border border-hairline rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  {topics.length > 0 && (
                    <>
                      <div className="px-1.5 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Dari Topic Bank
                      </div>
                      <div className="relative mb-1.5">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <Input
                          value={topicSearch}
                          onChange={(e) => setTopicSearch(e.target.value)}
                          placeholder="Cari topic…"
                          className="pl-8 h-8 text-xs bg-muted/20 border-hairline rounded-lg"
                        />
                      </div>
                      <div className="space-y-0.5 max-h-56 overflow-y-auto mb-2">
                        {filteredTopics.length === 0 && (
                          <p className="px-2 py-3 text-xs text-muted-foreground text-center">Tidak ada topic cocok.</p>
                        )}
                        {filteredTopics.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              onPickTopic(t);
                              setAttachOpen(false);
                            }}
                            className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-left hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-medium truncate flex-1">{t.title}</span>
                            <span className="text-[9px] font-mono uppercase text-muted-foreground shrink-0">{t.status}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {topics.length === 0 && (
                    <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                      Topic Bank masih kosong.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {modelSelector}
              
              <button
                type="button"
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted/40 cursor-pointer"
                aria-label="Input suara"
              >
                <Mic className="size-4" />
              </button>

              <button
                type="button"
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted/40 cursor-pointer"
                aria-label="Visualizer suara"
              >
                <AudioLines className="size-4" />
              </button>

              <Button
                type="button"
                size="icon"
                onClick={busy ? onCancel : onSubmit}
                disabled={!busy && !canSend}
                aria-label={busy ? "Hentikan proses" : "Kirim"}
                className="size-8 rounded-lg shrink-0"
              >
                {busy ? <Square className="size-3.5" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* One footer line, not two stacked bars: model on the left, key hints on the
            right. On narrow widths the hints drop out before the model selector does. */}
        <div className="flex items-center justify-between gap-3 px-0.5">
          <div className="min-w-0 flex-1">{footer}</div>
          <p className="hidden shrink-0 text-[10px] text-muted-foreground/70 sm:block">
            ↵ kirim · Shift+↵ baris baru · ↑↓ riwayat
          </p>
        </div>

      </div>
    </div>
  );
}
