"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ExternalLink,
  Plus,
  Loader2,
  Eraser,
  Send,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  markCarouselStatusAction,
  publishSavedCarouselAction,
  cleanupCarouselImagesAction,
  cleanupPostedImagesAction,
} from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { CarouselStatusBadge, CarouselStatusDot } from "@/components/status-badge";
import { Thumb } from "@/components/thumb";
import { cn } from "@/lib/utils";
import type { Carousel } from "@/lib/history/repo";

interface HistoryClientProps {
  initialItems: Carousel[];
}

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dayLongFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" });
const dueFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function HistoryClient({ initialItems }: HistoryClientProps) {
  const [items, setItems] = useState<Carousel[]>(initialItems);
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedCarousel, setSelectedCarousel] = useState<Carousel | null>(null);

  // Date time scheduling state
  const [schedulingTarget, setSchedulingTarget] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState("");

  const [pending, startTransition] = useTransition();
  const [publishingId, setPublishingId] = useState<string | null>(null);

  /**
   * Which cleanup is awaiting confirmation: a single deck, or every posted one.
   *
   * Confirmed rather than immediate because it deletes assets on Cloudinary and there is
   * no undo — the slides would have to be rendered and uploaded again, which is the
   * single most expensive thing this system does.
   */
  const [cleanupTarget, setCleanupTarget] = useState<Carousel | "posted" | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  /**
   * Free Cloudinary assets for one deck, or for every deck already posted.
   *
   * The thumbnail survives, so the calendar still renders what it always did. The backend
   * refuses a deck that is still scheduled: Buffer fetches the image when the post goes
   * out, so deleting early would publish a hole and the failure would only surface later,
   * on the live account.
   */
  const runCleanup = async () => {
    if (!cleanupTarget) return;
    setCleaningUp(true);
    try {
      if (cleanupTarget === "posted") {
        const res = await cleanupPostedImagesAction();
        const decks = res.results.length;
        toast.success(
          decks === 0
            ? "Tidak ada aset yang perlu dibersihkan."
            : `${res.deleted} gambar dibersihkan dari ${decks} konten.`
        );
        const cleaned = new Set(res.results.map((r) => r.carouselId));
        setItems((prev) =>
          prev.map((c) =>
            cleaned.has(c.id)
              ? { ...c, imageUrls: c.thumbnail && c.imageUrls.includes(c.thumbnail) ? [c.thumbnail] : [] }
              : c
          )
        );
      } else {
        const r = await cleanupCarouselImagesAction(cleanupTarget.id);
        toast.success(
          r.missed > 0
            ? `${r.deleted} gambar dibersihkan, ${r.missed} sudah tidak ada di Cloudinary.`
            : `${r.deleted} gambar dibersihkan.`
        );
        const keptUrls =
          cleanupTarget.thumbnail && cleanupTarget.imageUrls.includes(cleanupTarget.thumbnail)
            ? [cleanupTarget.thumbnail]
            : [];
        setItems((prev) =>
          prev.map((c) => (c.id === cleanupTarget.id ? { ...c, imageUrls: keptUrls } : c))
        );
        setSelectedCarousel((c) => (c && c.id === cleanupTarget.id ? { ...c, imageUrls: keptUrls } : c));
      }
      setCleanupTarget(null);
    } catch (e) {
      // The backend's refusal for a scheduled deck arrives here as its own message, which
      // says more than a generic failure would.
      toast.error(e instanceof Error ? e.message : "Gagal membersihkan aset.");
    } finally {
      setCleaningUp(false);
    }
  };

  const postedWithAssets = items.filter(
    (c) => c.status === "posted" && c.imageUrls && c.imageUrls.length > 0
  ).length;

  // Reschedule or schedule a carousel
  const handleScheduleCarousel = async () => {
    if (!schedulingTarget || !scheduleTime) return;
    const date = new Date(scheduleTime);
    if (date <= new Date()) {
      toast.error("Waktu scheduling harus di masa depan!");
      return;
    }

    startTransition(async () => {
      try {
        await markCarouselStatusAction(schedulingTarget, {
          status: "scheduled",
          dueAt: date.toISOString()
        });

        setItems(prev => prev.map(item => {
          if (item.id === schedulingTarget) {
            return {
              ...item,
              status: "scheduled",
              dueAt: date.toISOString()
            };
          }
          return item;
        }));

        toast.success("Konten berhasil dijadwalkan!");
        setSchedulingTarget(null);
        setScheduleTime("");
      } catch (err) {
        toast.error(`Gagal menjadwalkan: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  };

  // Upload/publish scheduled content to Buffer immediately
  const handlePublishToBuffer = async (carousel: Carousel) => {
    if (!carousel.dueAt) {
      toast.error("Set tanggal schedule terlebih dahulu!");
      return;
    }

    setPublishingId(carousel.id);
    try {
      const results = await publishSavedCarouselAction(carousel.id, carousel.dueAt);

      setItems(prev => prev.map(item => {
        if (item.id === carousel.id) {
          return {
            ...item,
            status: "scheduled",
            bufferIgId: results.igPostId || null,
            bufferTtId: results.ttPostId || null
          };
        }
        return item;
      }));

      toast.success("Berhasil diupload dan dijadwalkan ke Buffer!");
      if (selectedCarousel?.id === carousel.id) {
        setSelectedCarousel(prev => prev ? {
          ...prev,
          status: "scheduled",
          bufferIgId: results.igPostId || null,
          bufferTtId: results.ttPostId || null
        } : null);
      }
    } catch (err) {
      toast.error(`Gagal mempublikasikan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPublishingId(null);
    }
  };

  // Helper: check if two dates are on the same day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Extract scheduled items for calendar rendering
  const getScheduledItemsForDate = (date: Date) => {
    return items.filter(item => {
      if (!item.dueAt) return false;
      const due = new Date(item.dueAt);
      return isSameDay(due, date);
    }).sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
  };

  // Unscheduled items (stock content)
  const unscheduledItems = useMemo(() => {
    return items.filter(item => !item.dueAt);
  }, [items]);

  // Calendar cells generation logic
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startDayIndex = firstDay.getDay(); // 0 is Sunday

    // Number of days in current month
    const numDays = new Date(year, month + 1, 0).getDate();

    // Number of days in previous month
    const prevNumDays = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Padding from previous month
    for (let i = startDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevNumDays - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= numDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Padding from next month
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return cells;
  }, [currentDate]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const postsThisMonth = items.filter((item) => {
    if (!item.dueAt) return false;
    const due = new Date(item.dueAt);
    return due.getMonth() === currentDate.getMonth() && due.getFullYear() === currentDate.getFullYear();
  }).length;

  const openSchedule = (c: Carousel) => {
    setSchedulingTarget(c.id);
    // `dueAt` is UTC ISO and the input wants local wall-clock time. Slicing the ISO
    // string showed 05:30 for a 12:30 WIB post, and saving it unchanged moved the post.
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (c.dueAt) {
      setScheduleTime(local(new Date(c.dueAt)));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setScheduleTime(local(tomorrow));
    }
    setSelectedCarousel(null);
  };

  const dayItems = selectedDate ? getScheduledItemsForDate(selectedDate) : [];
  const today = new Date();

  const row = (item: Carousel, meta: string) => (
    <li key={item.id}>
      <button
        type="button"
        onClick={() => setSelectedCarousel(item)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent"
      >
        <Thumb src={item.thumbnail} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{item.title || "Untitled"}</span>
          <span className="block text-xs text-muted-foreground tabular-nums">{meta}</span>
        </span>
        <CarouselStatusBadge status={item.status} />
      </button>
    </li>
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Jadwal posting, dan konten yang belum diberi tanggal."
        actions={
          <>
            {/* Bulk cleanup. Only offered when there is actually something to free, and only
                ever touches decks already posted — Instagram and TikTok hold their own copies
                from the moment Buffer publishes, so those slides are dead weight. */}
            {postedWithAssets > 0 && (
              <Button
                variant="ghost"
                onClick={() => setCleanupTarget("posted")}
                title="Hapus aset Cloudinary dari konten yang sudah diposting"
                className="text-muted-foreground"
              >
                <Eraser />
                Bersihkan aset ({postedWithAssets})
              </Button>
            )}
            <div role="group" aria-label="Tampilan" className="inline-flex rounded-lg border border-border p-0.5">
              {(
                [
                  { id: "calendar", label: "Calendar", icon: CalendarIcon },
                  { id: "list", label: "List", icon: ListIcon },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    view === id ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <Link href="/create" className={buttonVariants()}>
              <Plus /> Buat carousel
            </Link>
          </>
        }
      />

      <div className="p-4 md:p-6">
        {view === "calendar" ? (
          <div className="grid grid-cols-1 items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* The month */}
            <section className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex h-12 items-center justify-between gap-2 border-b border-border px-4">
                <h2 className="text-sm font-medium">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  <span className="ml-2 font-normal text-muted-foreground tabular-nums">{postsThisMonth} posting</span>
                </h2>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" onClick={prevMonth} aria-label="Bulan sebelumnya">
                    <ChevronLeft />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>
                    Hari ini
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={nextMonth} aria-label="Bulan berikutnya">
                    <ChevronRight />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs text-muted-foreground">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="px-2 py-1.5">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarCells.map((cell, idx) => {
                  const cellItems = getScheduledItemsForDate(cell.date);
                  const isSelected = selectedDate && isSameDay(cell.date, selectedDate);
                  const isToday = isSameDay(cell.date, today);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      className={cn(
                        "flex min-h-14 cursor-pointer flex-col gap-1 border-border p-1.5 transition-colors sm:min-h-24",
                        idx % 7 !== 6 && "border-r",
                        idx < 35 && "border-b",
                        !cell.isCurrentMonth && "bg-muted/30",
                        isSelected ? "bg-accent" : "hover:bg-accent/50"
                      )}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedDate(cell.date); }}
                        aria-label={dayLongFmt.format(cell.date)}
                        aria-pressed={Boolean(isSelected)}
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isToday
                            ? "bg-foreground font-medium text-background"
                            : cell.isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground/60"
                        )}
                      >
                        {cell.date.getDate()}
                      </button>

                      {/* Dots on a phone, titles where there is room for them. */}
                      {cellItems.length > 0 && (
                        <div className="flex gap-1 px-1 sm:hidden">
                          {cellItems.slice(0, 4).map((item) => (
                            <CarouselStatusDot key={item.id} status={item.status} />
                          ))}
                        </div>
                      )}
                      <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                        {cellItems.slice(0, 3).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCarousel(item);
                            }}
                            title={`${item.title} (${item.status})`}
                            className="flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <CarouselStatusDot status={item.status} />
                            <span className="truncate">{item.title || "Untitled"}</span>
                          </button>
                        ))}
                        {cellItems.length > 3 && (
                          <span className="px-1 text-xs text-muted-foreground">+{cellItems.length - 3} lagi</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="flex min-w-0 flex-col gap-4 md:gap-6">
              {/* The selected day */}
              <section className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex h-12 items-center border-b border-border px-4">
                  <h2 className="text-sm font-medium capitalize">
                    {selectedDate ? dayLongFmt.format(selectedDate) : "Pilih tanggal"}
                  </h2>
                </div>
                {dayItems.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">Tidak ada posting di tanggal ini.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {dayItems.map((item) => row(item, timeFmt.format(new Date(item.dueAt!))))}
                  </ul>
                )}
              </section>

              {/* Everything without a date. Mostly exported stock, but not only: a row can be
                  marked scheduled without ever being given a time, and it belongs here too. */}
              <section className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex h-12 items-center justify-between border-b border-border px-4">
                  <h2 className="text-sm font-medium">
                    Tanpa tanggal <span className="font-normal text-muted-foreground tabular-nums">{unscheduledItems.length}</span>
                  </h2>
                </div>
                {unscheduledItems.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">Semua konten sudah punya tanggal.</p>
                ) : (
                  <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                    {unscheduledItems.map((item) => row(item, `${item.slideCount} slide`))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        ) : (
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            {items.length === 0 ? (
              <p className="px-4 py-16 text-center text-sm text-muted-foreground">
                Belum ada carousel.{" "}
                <Link href="/create" className="text-foreground underline underline-offset-4">Buat yang pertama</Link>.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-normal">Judul</th>
                      <th className="hidden px-4 py-2 font-normal lg:table-cell">Model</th>
                      <th className="hidden px-4 py-2 font-normal lg:table-cell">Slide</th>
                      <th className="hidden px-4 py-2 font-normal sm:table-cell">Jadwal</th>
                      <th className="px-4 py-2 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => {
                      const channels = [item.bufferIgId && "IG", item.bufferTtId && "TikTok"].filter(Boolean).join(" · ");
                      return (
                        <tr
                          key={item.id}
                          className="cursor-pointer transition-colors hover:bg-accent/50"
                          onClick={() => setSelectedCarousel(item)}
                        >
                          <td className="w-full max-w-0 px-4 py-2">
                            <div className="flex items-center gap-3">
                              <Thumb src={item.thumbnail} />
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedCarousel(item); }}
                                  className="block max-w-full truncate text-left outline-none hover:underline focus-visible:underline"
                                >
                                  {item.title || "Untitled"}
                                </button>
                                <p className="hidden truncate text-xs text-muted-foreground sm:block">{item.caption}</p>
                                {/* Phones drop the Jadwal column; the date moves under the title. */}
                                <p className="truncate text-xs text-muted-foreground sm:hidden">
                                  {item.dueAt ? dueFmt.format(new Date(item.dueAt)) : "Belum dijadwalkan"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-4 py-2 text-muted-foreground lg:table-cell">
                            {item.model ? item.model.split("/").pop() : item.source}
                          </td>
                          <td className="hidden px-4 py-2 tabular-nums text-muted-foreground lg:table-cell">{item.slideCount}</td>
                          <td className="hidden whitespace-nowrap px-4 py-2 tabular-nums sm:table-cell">
                            {item.dueAt ? (
                              <>
                                {dueFmt.format(new Date(item.dueAt))}
                                {channels ? <span className="block text-xs text-muted-foreground">{channels}</span> : null}
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2"><CarouselStatusBadge status={item.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Set or change the publish time */}
      <Dialog open={schedulingTarget !== null} onOpenChange={(o) => !o && setSchedulingTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadwalkan carousel</DialogTitle>
            <DialogDescription>Setelah dijadwalkan, konten muncul di kalender pada tanggal ini.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="schedule-at">Waktu publish</Label>
            <Input
              id="schedule-at"
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulingTarget(null)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={handleScheduleCarousel} disabled={pending || !scheduleTime}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Simpan jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One carousel: what it is, where it stands, and the next thing to do with it */}
      <Dialog open={selectedCarousel !== null} onOpenChange={(o) => !o && setSelectedCarousel(null)}>
        {selectedCarousel ? (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader className="pr-8">
              <DialogTitle className="truncate">{selectedCarousel.title || "Untitled"}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                <CarouselStatusBadge status={selectedCarousel.status} />
                <span>{selectedCarousel.slideCount} slide</span>
                {selectedCarousel.model ? <span>· {selectedCarousel.model.split("/").pop()}</span> : null}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <div className="flex flex-col gap-3">
                <Thumb src={selectedCarousel.thumbnail} className="w-full rounded-md" />
                {selectedCarousel.imageUrls && selectedCarousel.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCarousel.imageUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums hover:text-foreground"
                      >
                        {i + 1} <ExternalLink className="size-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <div className="grid gap-1.5">
                  <span className="text-xs text-muted-foreground">Caption</span>
                  <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed">
                    {selectedCarousel.caption || "—"}
                  </div>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">Jadwal</dt>
                  <dd className="tabular-nums">
                    {selectedCarousel.dueAt ? new Date(selectedCarousel.dueAt).toLocaleString("id-ID") : "Belum dijadwalkan"}
                  </dd>
                  <dt className="text-muted-foreground">Buffer</dt>
                  <dd>
                    {selectedCarousel.bufferIgId || selectedCarousel.bufferTtId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle className="size-3.5 text-emerald-600 dark:text-emerald-500" />
                        {[selectedCarousel.bufferIgId && "Instagram", selectedCarousel.bufferTtId && "TikTok"].filter(Boolean).join(" · ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Belum dikirim</span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>

            <DialogFooter className="items-center border-t border-border pt-4">
              {/* Free the slide assets. Offered whenever there is more than the
                  thumbnail to free and the deck is not waiting on Buffer — a scheduled
                  deck still needs its images at post time, so the backend refuses it
                  and there is no point offering the button. */}
              {selectedCarousel.status !== "scheduled" &&
                (selectedCarousel.imageUrls?.length ?? 0) > 1 && (
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive sm:mr-auto"
                    onClick={() => setCleanupTarget(selectedCarousel)}
                  >
                    <Eraser />
                    Bersihkan aset ({selectedCarousel.imageUrls.length - 1})
                  </Button>
                )}

              {Boolean(selectedCarousel.bufferIgId || selectedCarousel.bufferTtId || selectedCarousel.status === "posted") ? (
                <span className="text-sm text-muted-foreground">Sudah terjadwal di Buffer.</span>
              ) : (
                <>
                  <Button variant="outline" onClick={() => openSchedule(selectedCarousel)}>
                    {selectedCarousel.dueAt ? "Ubah jadwal" : "Set jadwal"}
                  </Button>

                  {selectedCarousel.dueAt && selectedCarousel.status !== "posted" && (
                    <Button
                      onClick={() => handlePublishToBuffer(selectedCarousel)}
                      disabled={publishingId === selectedCarousel.id}
                    >
                      {publishingId === selectedCarousel.id ? <Loader2 className="animate-spin" /> : <Send />}
                      {publishingId === selectedCarousel.id ? "Mengirim…" : "Kirim ke Buffer"}
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      {/* Confirm before deleting. There is no undo: recovering a slide means rendering and
          uploading it again, which is the most expensive thing this system does. */}
      <Dialog open={cleanupTarget !== null} onOpenChange={(o) => !o && setCleanupTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bersihkan aset gambar?</DialogTitle>
            <DialogDescription>
              <span className="block space-y-2">
                {cleanupTarget === "posted" ? (
                  <span className="block">
                    Menghapus gambar slide di Cloudinary untuk <strong>{postedWithAssets} konten
                    yang sudah diposting</strong>. Instagram dan TikTok sudah menyimpan salinannya
                    sendiri sejak Buffer memposting, jadi aset ini tidak dipakai lagi.
                  </span>
                ) : cleanupTarget ? (
                  <span className="block">
                    Menghapus <strong>{Math.max((cleanupTarget.imageUrls?.length ?? 1) - 1, 0)} gambar
                    slide</strong> dari “{cleanupTarget.title}”.
                  </span>
                ) : null}
                <span className="block">
                  Thumbnail tetap disimpan, jadi kalender masih menampilkan konten ini seperti biasa.
                  Konten yang masih <strong>terjadwal</strong> tidak akan disentuh — Buffer baru
                  mengambil gambarnya saat posting.
                </span>
                <span className="block text-destructive">
                  Tidak bisa dibatalkan. Untuk mendapatkannya kembali, deck harus di-export ulang.
                </span>
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanupTarget(null)} disabled={cleaningUp}>
              Batal
            </Button>
            <Button variant="destructive" onClick={runCleanup} disabled={cleaningUp}>
              {cleaningUp ? <Loader2 className="animate-spin" /> : <Eraser />}
              {cleaningUp ? "Membersihkan…" : "Bersihkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
