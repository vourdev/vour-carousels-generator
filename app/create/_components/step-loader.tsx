"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { elapsedSeconds, phaseAt } from "./utils";

/* ── Per-step loading state ──────────────────────────────────────────────
 * Every long-running step in the studio declares a job here. The phases are
 * indicative (the AI/export calls don't stream progress) so the loader shows a
 * real elapsed clock next to them and parks on the last phase until the call
 * actually resolves — it never fakes a completion. */
export const LOADING_JOBS = {
  brief: {
    title: "Menyusun brief outline",
    phases: [
      "Membaca ide & sudut pandangnya",
      "Menyusun kerangka slide",
      "Menulis copy dengan voice @vourdev",
      "Merapikan caption & hashtag",
    ],
  },
  briefRevise: {
    title: "Merevisi brief outline",
    phases: [
      "Membaca instruksi revisi",
      "Menyesuaikan bagian yang diminta",
      "Menjaga voice tetap konsisten",
    ],
  },
  plan: {
    title: "Merender rancangan slide",
    phases: [
      "Membaca brief yang disetujui",
      "Memilih mockup tiap slide",
      "Menyusun slide plan",
      "Validasi budget copy & ikon",
    ],
  },
  planRevise: {
    title: "Merevisi rancangan slide",
    phases: [
      "Mencari slide yang dimaksud",
      "Menerapkan perubahan",
      "Merender ulang preview",
    ],
  },
  export: {
    title: "Mengekspor slide ke JPEG",
    phases: [
      "Merender HTML tiap slide",
      "Memotret canvas 1080×1350",
      "Menyiapkan berkas gambar",
    ],
  },
} as const;

export type LoadingKind = keyof typeof LOADING_JOBS;

/**
 * Current wall-clock time, refreshed on a timer and immediately when the tab is shown.
 *
 * The value lives in state rather than being read with Date.now() during render, so the
 * component stays pure. Correctness in a hidden tab comes from re-reading the clock on
 * each tick: the browser may clamp this interval to once per second or freeze it
 * outright, and the numbers still come back truthful the moment the tab is looked at.
 */
function useNow(ms = 500): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const bump = () => setNow(Date.now());
    const id = setInterval(bump, ms);
    document.addEventListener("visibilitychange", bump);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", bump);
    };
  }, [ms]);
  return now;
}

/**
 * Shared loading indicator. "panel" overlays the workspace with a phase checklist;
 * "inline" is the compact form used inside the chat feed.
 * Render with key={kind} — a new job remounts it instead of resetting state.
 */
export function StepLoader({
  kind,
  variant = "panel",
}: {
  kind: LoadingKind;
  variant?: "panel" | "inline";
}) {
  const { title, phases } = LOADING_JOBS[kind];
  // Captured once per mount; the caller remounts with key={kind} for a new job.
  const [startedAt] = useState(() => Date.now());
  const now = useNow();

  const elapsed = elapsedSeconds(startedAt, now);
  const phase = phaseAt(startedAt, now, phases.length);

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2.5 self-start max-w-[85%]">
        <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Loader2 className="size-3.5 text-primary animate-spin" />
        </div>
        <div className="p-3.5 bg-card border border-hairline rounded-2xl rounded-tl-none flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">{title}</span>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{elapsed}s</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="truncate">{phases[phase]}…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xs flex flex-col gap-3.5 p-5 rounded-2xl border border-hairline bg-card shadow-lg">
        <div className="flex items-center gap-2.5">
          <Loader2 className="size-4 text-primary animate-spin shrink-0" />
          <span className="text-xs font-semibold truncate">{title}</span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
            {elapsed}s
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {phases.map((label, i) => {
            const done = i < phase;
            const active = i === phase;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 text-[11px] leading-snug transition-colors ${
                  active ? "text-foreground font-medium" : done ? "text-muted-foreground" : "text-muted-foreground/50"
                }`}
              >
                {done ? (
                  <Check className="size-3 text-emerald-500 shrink-0" />
                ) : active ? (
                  <span className="size-3 flex items-center justify-center shrink-0">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  </span>
                ) : (
                  <span className="size-3 flex items-center justify-center shrink-0">
                    <span className="size-1.5 rounded-full border border-muted-foreground/40" />
                  </span>
                )}
                <span className="truncate">{label}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-[10px] text-muted-foreground border-t border-hairline pt-2.5">
          Boleh pindah tab, prosesnya jalan terus. Jangan tutup tab ini sampai selesai.
        </p>
      </div>
    </div>
  );
}
