"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Copy, RefreshCw, Trash2, X } from "lucide-react";

/**
 * What the server actually saw, readable without SSH.
 *
 * Next.js replaces the message of any error thrown inside a Server Action with a generic
 * sentence and a digest before it reaches the browser. Every AI call here is a Server
 * Action, so a failed generation used to surface as "an error occurred" and the text that
 * explained it stayed in the container log. This reads the same failures back from
 * `/api/diag/errors`, which is a Route Handler and therefore not redacted.
 *
 * Polling rather than pushing: failures are rare, the app has one operator, and the whole
 * payload is at most fifty short strings from the same box. A websocket would be more
 * machinery than the problem is worth.
 */

const EASE = "cubic-bezier(0.2,0,0,1)";
const POLL_MS = 20_000;

interface Entry {
  id: string;
  at: number;
  where: string;
  status?: number;
  message: string;
}

function timeOf(at: number): string {
  return new Date(at).toLocaleTimeString("id-ID", { hour12: false });
}

export function ErrorConsole() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/diag/errors", { cache: "no-store" });
      if (!res.ok) return; // signed out, or the app is still booting — not worth surfacing
      const json = (await res.json()) as { entries?: Entry[] };
      setEntries(json.entries ?? []);
    } catch {
      // The console failing to load is not itself an incident worth announcing.
    }
  }, []);

  useEffect(() => {
    const poll = () => void load();
    // Scheduled rather than called: the effect body itself must not set state, and the
    // first read is the same "poll now" the timer and the focus listener perform.
    const first = setTimeout(poll, 0);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);
    window.addEventListener("focus", poll);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener("focus", poll);
    };
  }, [load]);

  const clear = async () => {
    setBusy(true);
    try {
      await fetch("/api/diag/errors", { method: "DELETE" });
      setEntries([]);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    const text = entries
      .map((e) => `[${timeOf(e.at)}] ${e.where}${e.status ? ` (${e.status})` : ""}\n${e.message}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Nothing has failed: stay out of the way entirely.
  if (entries.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      {open ? (
        <section
          role="log"
          aria-label="Log kesalahan server"
          className="w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-hairline-strong/60 bg-card shadow-lg"
          style={{ transition: `opacity 160ms ${EASE}` }}
        >
          <header className="flex items-center gap-2 border-b border-hairline-strong/40 px-3 py-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden />
            <h2 className="text-xs font-semibold">
              {entries.length} kesalahan terakhir dari server
            </h2>
            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => void load()}
                title="Muat ulang"
                className="rounded p-1.5 text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
              >
                <RefreshCw className="size-3.5" aria-hidden />
                <span className="sr-only">Muat ulang</span>
              </button>
              <button
                type="button"
                onClick={() => void copyAll()}
                title="Salin semua"
                className="rounded p-1.5 text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
              >
                <Copy className="size-3.5" aria-hidden />
                <span className="sr-only">Salin semua</span>
              </button>
              <button
                type="button"
                onClick={() => void clear()}
                disabled={busy}
                title="Bersihkan"
                className="rounded p-1.5 text-foreground/60 hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden />
                <span className="sr-only">Bersihkan</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Tutup"
                className="rounded p-1.5 text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden />
                <span className="sr-only">Tutup</span>
              </button>
            </div>
          </header>

          {copied && (
            <p className="border-b border-hairline-strong/40 px-3 py-1 text-[11px] text-foreground/60">
              Disalin ke clipboard.
            </p>
          )}

          <ul className="max-h-[min(24rem,50vh)] divide-y divide-hairline-strong/30 overflow-y-auto">
            {entries.map((e) => (
              <li key={e.id} className="px-3 py-2">
                <p className="flex items-baseline gap-2 text-[11px] text-foreground/60">
                  <span className="tabular-nums">{timeOf(e.at)}</span>
                  <span className="font-medium text-foreground/80">{e.where}</span>
                  {e.status !== undefined && (
                    <span className="rounded bg-foreground/10 px-1 tabular-nums">{e.status}</span>
                  )}
                </p>
                <p className="mt-1 break-words font-mono text-[11px] leading-relaxed text-foreground/90">
                  {e.message}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-hairline-strong/60 bg-card px-3 py-1.5 text-xs font-medium shadow-lg hover:bg-foreground/5"
          style={{ transition: `background-color 160ms ${EASE}` }}
        >
          <AlertTriangle className="size-3.5 text-amber-500" aria-hidden />
          <span className="tabular-nums">{entries.length}</span>
          <span>kesalahan server</span>
        </button>
      )}
    </div>
  );
}
