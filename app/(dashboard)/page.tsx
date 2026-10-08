import type { Metadata } from "next";

import Link from "next/link";

import { ArrowRight, CalendarX2, Inbox, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { CarouselStatusBadge, TopicStatusBadge } from "@/components/status-badge";
import { Thumb } from "@/components/thumb";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Carousel, listCarousels } from "@/lib/history/repo";
import { requireSession } from "@/lib/session";
import { getTopics, type Topic } from "@/lib/topics/bank";

import { type ActivityPoint, ActivityChart } from "./_components/overview/activity-chart";
import { type Metric, MetricCards } from "./_components/overview/metric-cards";
import { listModelsAction } from "./create/actions";

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

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** 90 days back to 14 ahead, one point per local day. */
function buildActivity(carousels: Carousel[], now: number): ActivityPoint[] {
  const points = new Map<string, ActivityPoint>();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 89);
  for (let i = 0; i < 104; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = localDay(d);
    points.set(key, { date: key, exported: 0, scheduled: 0, posted: 0 });
  }
  for (const c of carousels) {
    if (c.status === "exported") {
      const p = points.get(localDay(new Date(c.createdAt)));
      if (p) p.exported++;
    } else if ((c.status === "scheduled" || c.status === "posted") && c.dueAt) {
      const p = points.get(localDay(new Date(c.dueAt)));
      if (p) p[c.status]++;
    }
  }
  return [...points.values()];
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
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const upcoming = carousels
    .filter((c) => c.status === "scheduled" && c.dueAt && Date.parse(c.dueAt) >= now)
    .sort((a, b) => Date.parse(a.dueAt ?? "") - Date.parse(b.dueAt ?? ""));
  const stock = carousels.filter((c) => c.status === "exported" && !c.dueAt);
  const postedThisMonth = carousels.filter(
    (c) => c.status === "posted" && c.dueAt && Date.parse(c.dueAt) >= monthStart.getTime(),
  );
  const failed = carousels.filter((c) => c.status === "failed");
  const queue = topics
    .filter((t) => t.status === "queued" || t.status === "idea")
    .sort(
      (a, b) =>
        Number(b.status === "queued") - Number(a.status === "queued") ||
        (a.scheduledDate ?? "~").localeCompare(b.scheduledDate ?? "~") ||
        b.priority - a.priority,
    );
  const recent = carousels.slice(0, 8);

  const metrics: Metric[] = [
    {
      id: "scheduled",
      label: "Terjadwal",
      value: upcoming.length,
      note: upcoming[0]?.dueAt ? `Berikutnya ${dayFmt.format(new Date(upcoming[0].dueAt))}` : "Tidak ada antrean",
      href: "/history",
    },
    { id: "stock", label: "Stok siap jadwal", value: stock.length, note: "Sudah diekspor, belum dijadwalkan", href: "/history" },
    {
      id: "posted",
      label: "Diposting bulan ini",
      value: postedThisMonth.length,
      note: failed.length ? "Ada yang gagal diposting" : "Tidak ada yang gagal",
      flag: failed.length ? { text: `${failed.length} gagal`, tone: "destructive" } : undefined,
      href: "/history",
    },
    {
      id: "queue",
      label: "Antrean topik",
      value: queue.length,
      note: `${queue.filter((t) => t.status === "queued").length} queued, sisanya ide`,
      href: "/topics",
    },
  ];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="Overview"
        description="Jadwal posting, stok konten, dan antrean topik @vourdev."
        actions={
          <Button asChild>
            <Link href="/create">
              <Plus data-icon="inline-start" />
              Buat carousel
            </Link>
          </Button>
        }
      />

      <MetricCards metrics={metrics} />

      <ActivityChart data={buildActivity(carousels, now)} />

      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jadwal terdekat</CardTitle>
            <CardDescription>Posting berikutnya ke Buffer</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/history">
                  Calendar <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <Empty className="border border-dashed py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarX2 />
                  </EmptyMedia>
                  <EmptyTitle>Belum ada yang terjadwal</EmptyTitle>
                  <EmptyDescription>
                    Jadwalkan stok dari <Link href="/history">Calendar</Link>.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="-mx-2 flex flex-col">
                {upcoming.slice(0, 6).map((c) => {
                  const due = new Date(c.dueAt ?? "");
                  return (
                    <li key={c.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                      <div className="w-20 shrink-0 text-xs tabular-nums">
                        <div className="font-medium">{dayFmt.format(due)}</div>
                        <div className="text-muted-foreground">{timeFmt.format(due)}</div>
                      </div>
                      <Thumb src={c.thumbnail} />
                      <span className="min-w-0 flex-1 truncate text-sm">{c.title || "Untitled"}</span>
                      <span className="hidden text-muted-foreground text-xs sm:inline">
                        {[c.bufferIgId && "IG", c.bufferTtId && "TikTok"].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Antrean topik</CardTitle>
            <CardDescription>Queued dulu, lalu ide dengan prioritas tertinggi</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/topics">
                  Topics <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <Empty className="border border-dashed py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox />
                  </EmptyMedia>
                  <EmptyTitle>Antrean kosong</EmptyTitle>
                  <EmptyDescription>
                    Generate ide di <Link href="/topics">Topics</Link>.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="-mx-2 flex flex-col">
                {queue.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{t.title}</p>
                      <p className="truncate text-muted-foreground text-xs capitalize">
                        {t.category}
                        {t.scheduledDate ? ` · ${dayFmt.format(new Date(t.scheduledDate))}` : ""}
                      </p>
                    </div>
                    <TopicStatusBadge status={t.status} />
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/create?topic=${t.id}`}>Buat</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Carousel terbaru</CardTitle>
          <CardDescription>Delapan yang terakhir diubah</CardDescription>
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/history">
                Semua <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        {recent.length === 0 ? (
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Belum ada carousel. Mulai dari <Link href="/create">Create</Link>.
          </CardContent>
        ) : (
          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 text-muted-foreground">Judul</TableHead>
                <TableHead className="h-10 text-muted-foreground">Status</TableHead>
                <TableHead className="hidden h-10 text-muted-foreground lg:table-cell">Slide</TableHead>
                <TableHead className="hidden h-10 text-muted-foreground lg:table-cell">Jadwal</TableHead>
                <TableHead className="h-10 text-right text-muted-foreground">Diubah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="w-full max-w-0">
                    <div className="flex items-center gap-3">
                      <Thumb src={c.thumbnail} />
                      <span className="truncate">{c.title || "Untitled"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CarouselStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">{c.slideCount}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {c.dueAt ? dayFmt.format(new Date(c.dueAt)) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{ago(c.updatedAt, now)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <p className="text-muted-foreground text-xs">
        {models.length > 0 ? (
          <>Model aktif di backend: {models.join(", ")}.</>
        ) : (
          <span className="text-destructive">
            Backend tidak melaporkan model aktif — cek koneksi backend atau API key provider.
          </span>
        )}
      </p>
    </div>
  );
}
