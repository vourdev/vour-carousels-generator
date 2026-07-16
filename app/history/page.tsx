import { requireSession } from "@/lib/session";
import { listCarousels, type CarouselStatus } from "@/lib/history/repo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const statusStyle: Record<CarouselStatus, string> = {
  draft: "text-muted-foreground border-border",
  exported: "text-blue-500 border-blue-500/30",
  scheduled: "text-amber-500 border-amber-500/30",
  posted: "text-emerald-500 border-emerald-500/30",
  failed: "text-destructive border-destructive/30",
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

export default async function HistoryPage() {
  const session = await requireSession();
  const items = await listCarousels(session.user.id);

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="gradient-text">History</span>
        </h1>
        <Link
          href="/"
          className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> home
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-16 text-center font-mono text-sm text-muted-foreground">
          belum ada carousel. bikin di{" "}
          <Link href="/create" className="text-link">
            /create
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {c.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title || "Untitled"}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {c.source} · {c.model ?? "—"} · {c.slideCount} slides · {timeAgo(c.createdAt)}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${statusStyle[c.status]}`}
                  >
                    {c.status}
                  </span>
                  {(c.bufferIgId || c.bufferTtId) && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {c.bufferIgId ? "IG" : ""}
                      {c.bufferIgId && c.bufferTtId ? "·" : ""}
                      {c.bufferTtId ? "TT" : ""}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
