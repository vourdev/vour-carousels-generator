import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { requireSession } from "@/lib/session";
import { listCarousels, type Carousel } from "@/lib/history/repo";
import { getTopics, type Topic } from "@/lib/topics/bank";
import { listModelsAction } from "./create/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { CarouselStatusBadge, TopicStatusBadge } from "@/components/status-badge";
import { Thumb } from "@/components/thumb";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

const dayFmt = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

function ago(ts: number, now: number): string {
  const m = Math.floor((now - ts) / 60_000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d} hari lalu` : dayFmt.format(ts);
}

function Section({
  title,
  href,
  linkLabel,
  children,
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-lg border border-border bg-card", className)}>
      <div className="flex h-11 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-medium">{title}</h2>
        {href ? (
          <Link href={href} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            {linkLabel} <ArrowRight className="size-3" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export default async function OverviewPage() {
  const session = await requireSession();
  const userId = session.user.id;
  // Each panel degrades on its own: a dead backend or a slow db should empty one list,
  // not 500 the page the operator lands on.
  const [carousels, topics, models] = await Promise.all([
    listCarousels(userId, 200).catch((): Carousel[] => []),
    getTopics(userId).catch((): Topic[] => []),
    listModelsAction().catch((): string[] => []),
  ]);

  // eslint-disable-next-line react-hooks/purity -- server component, rendered per request
  const now = Date.now();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const upcoming = carousels
    .filter((c) => c.status === "scheduled" && c.dueAt && Date.parse(c.dueAt) >= now)
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
  const stock = carousels.filter((c) => c.status === "exported" && !c.dueAt);
  const postedThisMonth = carousels.filter(
    (c) => c.status === "posted" && c.dueAt && Date.parse(c.dueAt) >= monthStart.getTime()
  );
  const failed = carousels.filter((c) => c.status === "failed");
  const queue = topics
    .filter((t) => t.status === "queued" || t.status === "idea")
    .sort(
      (a, b) =>
        Number(b.status === "queued") - Number(a.status === "queued") ||
        (a.scheduledDate ?? "~").localeCompare(b.scheduledDate ?? "~") ||
        b.priority - a.priority
    );
  const recent = carousels.slice(0, 8);

  const summary = [
    {
      label: "Terjadwal",
      value: upcoming.length,
      note: upcoming[0]?.dueAt ? `Berikutnya ${dayFmt.format(new Date(upcoming[0].dueAt))}` : "Tidak ada antrean",
      href: "/history",
    },
    { label: "Stok siap jadwal", value: stock.length, note: "Sudah diekspor, belum dijadwalkan", href: "/history" },
    { label: "Diposting bulan ini", value: postedThisMonth.length, note: failed.length ? `${failed.length} gagal` : "Tidak ada yang gagal", href: "/history" },
    { label: "Antrean topik", value: queue.length, note: `${queue.filter((t) => t.status === "queued").length} queued`, href: "/topics" },
  ];

  return (
    <AppShell email={session.user.email}>
      <PageHeader
        title="Overview"
        description="Jadwal posting, stok konten, dan antrean topik @vourdev."
        actions={
          <Link href="/create" className={buttonVariants()}>
            <Plus /> Buat carousel
          </Link>
        }
      />

      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <nav aria-label="Ringkasan" className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-4">
          {summary.map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              aria-label={`${s.label}: ${s.value}. ${s.note}`}
              className={cn(
                "flex flex-col gap-1 px-4 py-3 outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent",
                i % 2 === 1 && "border-l border-border",
                i >= 2 && "border-t border-border lg:border-t-0",
                i === 2 && "lg:border-l"
              )}
            >
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-xl font-semibold tabular-nums">{s.value}</span>
              <span className="truncate text-xs text-muted-foreground">{s.note}</span>
            </Link>
          ))}
        </nav>

        <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-2">
          <Section title="Jadwal terdekat" href="/history" linkLabel="Calendar">
            {upcoming.length === 0 ? (
              <Empty>
                Belum ada yang terjadwal. Jadwalkan stok dari{" "}
                <Link href="/history" className="text-foreground underline underline-offset-4">Calendar</Link>.
              </Empty>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.slice(0, 6).map((c) => {
                  const due = new Date(c.dueAt!);
                  return (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-20 shrink-0 text-xs tabular-nums">
                        <div className="font-medium">{dayFmt.format(due)}</div>
                        <div className="text-muted-foreground">{timeFmt.format(due)}</div>
                      </div>
                      <Thumb src={c.thumbnail} />
                      <span className="min-w-0 flex-1 truncate text-sm">{c.title || "Untitled"}</span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {[c.bufferIgId && "IG", c.bufferTtId && "TikTok"].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Antrean topik" href="/topics" linkLabel="Topics">
            {queue.length === 0 ? (
              <Empty>
                Antrean kosong. Generate ide di{" "}
                <Link href="/topics" className="text-foreground underline underline-offset-4">Topics</Link>.
              </Empty>
            ) : (
              <ul className="divide-y divide-border">
                {queue.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{t.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.category}
                        {t.scheduledDate ? ` · ${dayFmt.format(new Date(t.scheduledDate))}` : ""}
                      </p>
                    </div>
                    <TopicStatusBadge status={t.status} />
                    <Link
                      href={`/create?topic=${t.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Buat
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <Section title="Carousel terbaru" href="/history" linkLabel="Semua">
          {recent.length === 0 ? (
            <Empty>
              Belum ada carousel. Mulai dari{" "}
              <Link href="/create" className="text-foreground underline underline-offset-4">Create</Link>.
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-normal">Judul</th>
                    <th className="px-4 py-2 font-normal">Status</th>
                    <th className="hidden px-4 py-2 font-normal lg:table-cell">Slide</th>
                    <th className="hidden px-4 py-2 font-normal lg:table-cell">Jadwal</th>
                    <th className="px-4 py-2 text-right font-normal">Diubah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((c) => (
                    <tr key={c.id}>
                      <td className="w-full max-w-0 px-4 py-2">
                        <div className="flex items-center gap-3">
                          <Thumb src={c.thumbnail} />
                          <span className="truncate">{c.title || "Untitled"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2"><CarouselStatusBadge status={c.status} /></td>
                      <td className="hidden px-4 py-2 tabular-nums text-muted-foreground lg:table-cell">{c.slideCount}</td>
                      <td className="hidden px-4 py-2 text-muted-foreground lg:table-cell">
                        {c.dueAt ? dayFmt.format(new Date(c.dueAt)) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-muted-foreground">{ago(c.updatedAt, now)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <p className="text-xs text-muted-foreground">
          {models.length > 0 ? (
            <>Model aktif di backend: {models.join(", ")}.</>
          ) : (
            <span className="text-destructive">
              Backend tidak melaporkan model aktif — cek koneksi backend atau API key provider.
            </span>
          )}
        </p>
      </div>
    </AppShell>
  );
}
