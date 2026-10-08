"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";

import { CalendarDays, CheckCircle, Eraser, ExternalLink, List, Loader2, Plus, Send } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { CarouselStatusBadge } from "@/components/status-badge";
import { Thumb } from "@/components/thumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Carousel } from "@/lib/history/repo";

import {
  cleanupCarouselImagesAction,
  cleanupPostedImagesAction,
  markCarouselStatusAction,
  publishSavedCarouselAction,
} from "./actions";
import { CarouselsTable } from "./_components/carousels-table";
import { ScheduleCalendar } from "./_components/schedule-calendar";

const createdFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

/** datetime-local wants local wall-clock time; dueAt is stored as UTC ISO. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistoryClient({ initialItems }: { initialItems: Carousel[] }) {
  const [items, setItems] = useState<Carousel[]>(initialItems);
  const [selected, setSelected] = useState<Carousel | null>(null);

  const [scheduling, setScheduling] = useState<Carousel | null>(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [pending, startTransition] = useTransition();
  const [publishingId, setPublishingId] = useState<string | null>(null);

  /**
   * Which cleanup awaits confirmation: one deck, or every posted one. Confirmed because it
   * deletes the slide images with no undo — getting them back means rendering and
   * uploading again, the single most expensive thing this system does.
   */
  const [cleanupTarget, setCleanupTarget] = useState<Carousel | "posted" | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  const patch = (id: string, next: Partial<Carousel>) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...next } : c)));
    setSelected((c) => (c && c.id === id ? { ...c, ...next } : c));
  };

  const stock = useMemo(() => items.filter((c) => !c.dueAt), [items]);
  const postedWithAssets = items.filter((c) => c.status === "posted" && c.imageUrls?.length > 0).length;

  /**
   * The thumbnail survives a cleanup, so the calendar still renders what it did. The backend
   * refuses a deck that is still scheduled: Buffer fetches the image when the post goes out.
   */
  const runCleanup = async () => {
    if (!cleanupTarget) return;
    setCleaningUp(true);
    try {
      if (cleanupTarget === "posted") {
        const res = await cleanupPostedImagesAction();
        const decks = res.results.length;
        toast.success(decks === 0 ? "Tidak ada aset yang perlu dibersihkan." : `${res.deleted} gambar dibersihkan dari ${decks} konten.`);
        const cleaned = new Set(res.results.map((r) => r.carouselId));
        setItems((prev) =>
          prev.map((c) =>
            cleaned.has(c.id) ? { ...c, imageUrls: c.thumbnail && c.imageUrls.includes(c.thumbnail) ? [c.thumbnail] : [] } : c,
          ),
        );
      } else {
        const r = await cleanupCarouselImagesAction(cleanupTarget.id);
        toast.success(
          r.missed > 0 ? `${r.deleted} gambar dibersihkan, ${r.missed} sudah tidak ada.` : `${r.deleted} gambar dibersihkan.`,
        );
        const kept =
          cleanupTarget.thumbnail && cleanupTarget.imageUrls.includes(cleanupTarget.thumbnail) ? [cleanupTarget.thumbnail] : [];
        patch(cleanupTarget.id, { imageUrls: kept });
      }
      setCleanupTarget(null);
    } catch (e) {
      // The backend's refusal for a scheduled deck arrives as its own message, which says more.
      toast.error(e instanceof Error ? e.message : "Gagal membersihkan aset.");
    } finally {
      setCleaningUp(false);
    }
  };

  const openSchedule = (c: Carousel) => {
    const at = c.dueAt ? new Date(c.dueAt) : new Date();
    if (!c.dueAt) {
      at.setDate(at.getDate() + 1);
      at.setHours(9, 0, 0, 0);
    }
    setScheduleTime(toLocalInput(at));
    setScheduling(c);
    setSelected(null);
  };

  const saveSchedule = () => {
    if (!scheduling || !scheduleTime) return;
    const date = new Date(scheduleTime);
    if (date <= new Date()) {
      toast.error("Waktu publish harus di masa depan.");
      return;
    }
    const target = scheduling;
    startTransition(async () => {
      try {
        await markCarouselStatusAction(target.id, { status: "scheduled", dueAt: date.toISOString() });
        patch(target.id, { status: "scheduled", dueAt: date.toISOString() });
        toast.success("Konten dijadwalkan.");
        setScheduling(null);
      } catch (err) {
        toast.error(`Gagal menjadwalkan: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  };

  const publishToBuffer = async (c: Carousel) => {
    if (!c.dueAt) {
      toast.error("Set jadwal dulu.");
      return;
    }
    setPublishingId(c.id);
    try {
      const results = await publishSavedCarouselAction(c.id, c.dueAt);
      patch(c.id, { status: "scheduled", bufferIgId: results.igPostId || null, bufferTtId: results.ttPostId || null });
      toast.success("Terkirim dan terjadwal di Buffer.");
    } catch (err) {
      toast.error(`Gagal mengirim: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="Calendar"
        description="Jadwal posting, dan konten yang belum diberi tanggal."
        actions={
          <>
            {postedWithAssets > 0 ? (
              <Button variant="outline" onClick={() => setCleanupTarget("posted")}>
                <Eraser data-icon="inline-start" />
                Bersihkan aset ({postedWithAssets})
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/create">
                <Plus data-icon="inline-start" />
                Buat carousel
              </Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="calendar" className="gap-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarDays />
            Kalender
          </TabsTrigger>
          <TabsTrigger value="list">
            <List />
            Daftar
            <span className="text-muted-foreground text-xs tabular-nums">{items.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <ScheduleCalendar items={items} onSelect={setSelected} />
            <Card className="gap-0 py-0">
              <CardHeader className="border-b py-4">
                <CardTitle className="flex items-center gap-2">
                  Tanpa tanggal <Badge variant="secondary">{stock.length}</Badge>
                </CardTitle>
                <CardDescription>Stok yang belum dijadwalkan</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {stock.length === 0 ? (
                  <p className="px-4 py-8 text-center text-muted-foreground text-sm">Semua konten sudah punya jadwal.</p>
                ) : (
                  // A plain scroller: Radix ScrollArea's table-display viewport defeats truncate.
                  <div className="max-h-[min(36rem,60vh)] overflow-y-auto">
                    <ul className="flex flex-col py-1">
                      {stock.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(c)}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted"
                          >
                            <Thumb src={c.thumbnail} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm">{c.title || "Untitled"}</span>
                              <span className="block text-muted-foreground text-xs tabular-nums">
                                {c.slideCount} slide · {createdFmt.format(c.createdAt)}
                              </span>
                            </span>
                            <CarouselStatusBadge status={c.status} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list">
          <CarouselsTable items={items} onSelect={setSelected} />
        </TabsContent>
      </Tabs>

      {/* One carousel: what it is, where it stands, and the next thing to do with it. */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        {selected ? (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader className="pr-8">
              <DialogTitle className="truncate">{selected.title || "Untitled"}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                <CarouselStatusBadge status={selected.status} />
                <span>{selected.slideCount} slide</span>
                {selected.model ? <span>· {selected.model.split("/").pop()}</span> : null}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <div className="flex flex-col gap-3">
                <Thumb src={selected.thumbnail} className="w-full rounded-md" />
                {selected.imageUrls?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selected.imageUrls.map((url, i) => (
                      <Button key={url} asChild variant="outline" size="xs">
                        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Buka slide ${i + 1}`}>
                          {i + 1}
                          <ExternalLink data-icon="inline-end" />
                        </a>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <div className="grid gap-1.5">
                  <span className="text-muted-foreground text-xs">Caption</span>
                  <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
                    {selected.caption || "—"}
                  </div>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">Jadwal</dt>
                  <dd className="tabular-nums">
                    {selected.dueAt ? new Date(selected.dueAt).toLocaleString("id-ID") : "Belum dijadwalkan"}
                  </dd>
                  <dt className="text-muted-foreground">Buffer</dt>
                  <dd>
                    {selected.bufferIgId || selected.bufferTtId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle className="size-3.5 text-green-600 dark:text-green-500" />
                        {[selected.bufferIgId && "Instagram", selected.bufferTtId && "TikTok"].filter(Boolean).join(" · ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Belum dikirim</span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>

            <DialogFooter className="items-center border-t pt-4">
              {/* Offered whenever there is more than the thumbnail to free and the deck is not
                  waiting on Buffer — a scheduled deck still needs its images at post time. */}
              {selected.status !== "scheduled" && (selected.imageUrls?.length ?? 0) > 1 ? (
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive sm:mr-auto"
                  onClick={() => setCleanupTarget(selected)}
                >
                  <Eraser data-icon="inline-start" />
                  Bersihkan aset ({selected.imageUrls.length - 1})
                </Button>
              ) : null}
              {selected.bufferIgId || selected.bufferTtId || selected.status === "posted" ? (
                <span className="text-muted-foreground text-sm">Sudah terjadwal di Buffer.</span>
              ) : (
                <>
                  <Button variant="outline" onClick={() => openSchedule(selected)}>
                    {selected.dueAt ? "Ubah jadwal" : "Set jadwal"}
                  </Button>
                  {selected.dueAt ? (
                    <Button onClick={() => publishToBuffer(selected)} disabled={publishingId === selected.id}>
                      {publishingId === selected.id ? (
                        <Loader2 className="animate-spin" data-icon="inline-start" />
                      ) : (
                        <Send data-icon="inline-start" />
                      )}
                      {publishingId === selected.id ? "Mengirim…" : "Kirim ke Buffer"}
                    </Button>
                  ) : null}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={scheduling !== null} onOpenChange={(o) => !o && setScheduling(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Jadwalkan carousel</DialogTitle>
            <DialogDescription>Setelah dijadwalkan, konten muncul di kalender pada waktu ini.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="schedule-at">Waktu publish</FieldLabel>
            <Input
              id="schedule-at"
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduling(null)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={saveSchedule} disabled={pending || !scheduleTime}>
              {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
              Simpan jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cleanupTarget !== null} onOpenChange={(o) => !o && !cleaningUp && setCleanupTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bersihkan aset gambar?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-muted-foreground text-sm">
                {cleanupTarget === "posted" ? (
                  <p>
                    Menghapus gambar slide untuk <strong>{postedWithAssets} konten yang sudah diposting</strong>. Instagram
                    dan TikTok sudah menyimpan salinannya sejak Buffer memposting.
                  </p>
                ) : cleanupTarget ? (
                  <p>
                    Menghapus <strong>{Math.max((cleanupTarget.imageUrls?.length ?? 1) - 1, 0)} gambar slide</strong> dari “
                    {cleanupTarget.title}”.
                  </p>
                ) : null}
                <p>
                  Thumbnail tetap disimpan, jadi kalender masih menampilkan konten ini. Konten yang masih{" "}
                  <strong>terjadwal</strong> tidak disentuh — Buffer baru mengambil gambarnya saat posting.
                </p>
                <p className="text-destructive">Tidak bisa dibatalkan. Untuk mendapatkannya kembali, deck harus diekspor ulang.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleaningUp}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={cleaningUp}
              onClick={(e) => {
                e.preventDefault();
                void runCleanup();
              }}
            >
              {cleaningUp ? <Loader2 className="animate-spin" /> : <Eraser />}
              {cleaningUp ? "Membersihkan…" : "Bersihkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
