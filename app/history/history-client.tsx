"use client";

import { useState, useTransition, useMemo } from "react";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  List as ListIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  ExternalLink, 
  Play, 
  Plus, 
  AlertCircle,
  CalendarDays,
  Sparkles,
  Link2,
  Copy,
  Check,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  markCarouselStatusAction, 
  publishSavedCarouselAction 
} from "./actions";
import type { Carousel, CarouselStatus } from "@/lib/history/repo";

interface HistoryClientProps {
  initialItems: Carousel[];
  userId: string;
  betterAuthSecret: string;
}

const statusStyle: Record<CarouselStatus, { text: string; bg: string; border: string }> = {
  draft: { text: "text-muted-foreground", bg: "bg-muted/10", border: "border-border" },
  exported: { text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  scheduled: { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  posted: { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  failed: { text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
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

export default function HistoryClient({ initialItems, userId, betterAuthSecret }: HistoryClientProps) {
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
  const [copied, setCopied] = useState(false);

  const n8nUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/calendar?userId=${userId}`;
    }
    return `/api/calendar?userId=${userId}`;
  }, [userId]);

  const copyN8NUrl = () => {
    navigator.clipboard.writeText(n8nUrl);
    setCopied(true);
    toast.success("n8n API endpoint URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

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
      } catch (err: any) {
        toast.error(`Gagal menjadwalkan: ${err.message}`);
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
    } catch (err: any) {
      toast.error(`Gagal mempublikasikan: ${err.message}`);
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
    });
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

  return (
    <main className="mx-auto min-h-dvh max-w-7xl px-4 py-8 flex flex-col gap-6">
      
      {/* Header and Pill Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <CalendarDays className="size-5 text-primary" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Content Calendar &amp; History</h1>
              <p className="text-xs text-muted-foreground">Katalog konten stock dan kalender penjadwalan publish</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
          <div className="inline-flex p-0.5 bg-muted/50 rounded-lg border border-hairline shrink-0">
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "calendar" ? "bg-card text-foreground shadow-xs border border-hairline" : "text-muted-foreground"}`}
            >
              <CalendarIcon className="size-3.5" />
              Calendar View
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "list" ? "bg-card text-foreground shadow-xs border border-hairline" : "text-muted-foreground"}`}
            >
              <ListIcon className="size-3.5" />
              List View
            </button>
          </div>
          
          <Link
            href="/"
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground bg-card border border-hairline rounded-lg px-3 py-2"
          >
            <ArrowLeft className="size-3.5" /> Home
          </Link>
        </div>
      </div>

      {/* Calendar View Panel */}
      {view === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-stretch min-h-0">
          
          {/* LEFT: The Main Calendar Grid */}
          <div className="flex flex-col gap-4 bg-card border border-hairline rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <span className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded-full border border-hairline">
                  {items.filter(item => {
                    if (!item.dueAt) return false;
                    const due = new Date(item.dueAt);
                    return due.getMonth() === currentDate.getMonth() && due.getFullYear() === currentDate.getFullYear();
                  }).length} posts
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="size-8" onClick={prevMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCurrentDate(new Date())}>
                  Bulan Ini
                </Button>
                <Button variant="outline" size="icon" className="size-8" onClick={nextMonth}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Days Names */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground py-1 bg-muted/10 rounded-lg border border-hairline">
              <div>Minggu</div>
              <div>Senin</div>
              <div>Selasa</div>
              <div>Rabu</div>
              <div>Kamis</div>
              <div>Jumat</div>
              <div>Sabtu</div>
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-2 flex-1 min-h-[480px]">
              {calendarCells.map((cell, idx) => {
                const dayItems = getScheduledItemsForDate(cell.date);
                const isSelected = selectedDate && isSameDay(cell.date, selectedDate);
                const isToday = isSameDay(cell.date, new Date());
                
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`flex flex-col justify-between p-2 rounded-xl border transition-all cursor-pointer select-none aspect-square lg:aspect-auto ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : cell.isCurrentMonth
                        ? "border-hairline hover:bg-muted/10"
                        : "border-hairline/40 opacity-40 hover:bg-muted/5"
                    } ${isToday ? "bg-accent/10 border-accent/40" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold font-mono ${isToday ? "text-primary bg-primary/10 rounded-full size-5 flex items-center justify-center border border-primary/20" : ""}`}>
                        {cell.date.getDate()}
                      </span>
                      {cell.isCurrentMonth && dayItems.length > 0 && (
                        <span className="size-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>

                    {/* Micro items rendering */}
                    <div className="flex flex-col gap-1 mt-2 overflow-hidden max-h-[70px]">
                      {dayItems.slice(0, 3).map(item => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCarousel(item);
                          }}
                          className={`text-[9px] truncate px-1.5 py-0.5 rounded border leading-none font-mono ${statusStyle[item.status].bg} ${statusStyle[item.status].text} ${statusStyle[item.status].border} hover:opacity-85`}
                          title={`${item.title} (${item.status})`}
                        >
                          {item.title || "Untitled"}
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <div className="text-[8px] text-muted-foreground font-mono text-center leading-none">
                          +{dayItems.length - 3} lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Detail Day Selected */}
          <div className="flex flex-col h-full">
            
            {/* Panel 1: Scheduled on selected day */}
            <Card className="shadow-sm border-hairline flex flex-col flex-1 min-h-[400px]">
              <CardContent className="p-4 flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex items-center justify-between border-b pb-3 shrink-0">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" />
                    Schedule: {selectedDate ? selectedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Pilih Tanggal"}
                  </span>
                  <Link href="/create">
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2 text-primary hover:bg-primary/10 border border-primary/20">
                      <Plus className="size-3" />
                      Buat Konten
                    </Button>
                  </Link>
                </div>
                
                {selectedDate && getScheduledItemsForDate(selectedDate).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <p className="text-xs font-mono">Tidak ada konten dijadwalkan untuk hari ini.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 min-h-0">
                    {selectedDate && getScheduledItemsForDate(selectedDate).map(item => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCarousel(item)}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-hairline hover:bg-muted/10 cursor-pointer bg-card/50"
                      >
                        <div className="size-10 rounded border border-hairline bg-muted overflow-hidden shrink-0">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="size-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{item.title}</p>
                          <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                            {item.dueAt ? new Date(item.dueAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                        <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-full border leading-none font-mono ${statusStyle[item.status].bg} ${statusStyle[item.status].text} ${statusStyle[item.status].border}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* List View Panel */}
      {view === "list" ? (
        <Card className="border-hairline shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-sm font-mono text-muted-foreground">Belum ada konten carousel. Buat baru di /create.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-hairline bg-muted/20 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground font-mono">
                      <th className="py-3 px-4">Konten</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Slides</th>
                      <th className="py-3 px-4">Jadwal Publish</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {items.map(item => {
                      const hasBuffer = item.bufferIgId || item.bufferTtId;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/5 transition-colors cursor-pointer group text-xs align-middle"
                          onClick={() => setSelectedCarousel(item)}
                        >
                          {/* Col 1: Thumbnail & Title */}
                          <td className="py-3.5 px-4 font-medium max-w-[280px]">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-lg border border-hairline bg-muted overflow-hidden shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                {item.thumbnail ? (
                                  <img src={item.thumbnail} alt="" className="size-full object-cover" />
                                ) : (
                                  <div className="size-full" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">{item.title || "Untitled"}</p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[240px] mt-0.5 font-mono">{item.caption.substring(0, 50)}...</p>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Source & Model */}
                          <td className="py-3.5 px-4 text-muted-foreground font-mono text-[10px]">
                            <span className="capitalize">{item.source}</span>
                            {item.model && (
                              <span className="opacity-60 block mt-0.5 truncate max-w-[120px]" title={item.model}>
                                {item.model.split("/").pop()}
                              </span>
                            )}
                          </td>

                          {/* Col 3: Slide Count */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                            {item.slideCount} slides
                          </td>

                          {/* Col 4: Schedule Time & Destination */}
                          <td className="py-3.5 px-4">
                            {item.dueAt ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {new Date(item.dueAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {hasBuffer && (
                                  <span className="text-[9px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-hairline w-fit">
                                    Buffer: {item.bufferIgId ? "IG" : ""} {item.bufferIgId && item.bufferTtId ? "&" : ""} {item.bufferTtId ? "TT" : ""}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/50 font-mono">—</span>
                            )}
                          </td>

                          {/* Col 5: Status */}
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-flex items-center gap-1 text-[9px] uppercase px-2 py-0.5 rounded-full border leading-none font-mono font-semibold ${statusStyle[item.status].bg} ${statusStyle[item.status].text} ${statusStyle[item.status].border}`}>
                              <span className="size-1 rounded-full bg-current shrink-0" />
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Connection for n8n Section */}
      <Card className="border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-primary/5 to-transparent shadow-xs">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
              <Link2 className="size-3.5" />
              INTEGRASI API UNTUK N8N
            </span>
            <h3 className="font-bold text-sm">Gunakan Endpoint API ini untuk n8n Workflow Anda</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              n8n dapat menarik data kalender konten (status, caption, judul, thumbnail, dan link slide lengkap) 
              menggunakan metode <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">GET</code> dengan header <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">x-api-key</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="bg-muted/40 border border-hairline font-mono text-[11px] px-3 py-2 rounded-lg truncate select-all flex-1 md:flex-initial max-w-[280px]">
              {n8nUrl}
            </div>
            <Button size="icon" variant="outline" className="size-9 shrink-0" onClick={copyN8NUrl}>
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG 1: Scheduling Date-Time Picker Modal */}
      {schedulingTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-hairline rounded-2xl p-5 shadow-lg w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold flex items-center gap-2 pb-3 border-b">
              <Clock className="size-4 text-primary" />
              Jadwalkan Konten Carousel
            </h3>
            
            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-semibold uppercase">Pilih Waktu Publish (dueAt)</label>
                <Input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="text-xs"
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Tentukan waktu penjadwalan. Setelah dijadwalkan, postingan ini akan muncul di kalender pada tanggal tersebut.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-3.5">
              <Button variant="outline" size="sm" onClick={() => setSchedulingTarget(null)} disabled={pending}>
                Batal
              </Button>
              <Button size="sm" onClick={handleScheduleCarousel} disabled={pending || !scheduleTime}>
                {pending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Simpan Jadwal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 2: Detailed Carousel Card Info & Trigger Buffer */}
      {selectedCarousel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-hairline rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-3 shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-base truncate">{selectedCarousel.title || "Untitled"}</h3>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  ID: {selectedCarousel.id} · status: {selectedCarousel.status}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelectedCarousel(null)}>
                &times;
              </Button>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 flex-1 min-h-0 overflow-y-auto py-1">
              
              {/* Thumbnail and Slides View */}
              <div className="flex flex-col gap-3">
                <div className="aspect-[4/5] rounded-xl border border-hairline bg-muted overflow-hidden relative shadow-inner">
                  {selectedCarousel.thumbnail ? (
                    <img src={selectedCarousel.thumbnail} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground text-xs font-mono p-4 text-center">
                      No Thumbnail
                    </div>
                  )}
                </div>
                
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block text-center font-mono">
                  {selectedCarousel.slideCount} slides · PNG Format
                </span>

                {/* List of high-res image URLs */}
                {selectedCarousel.imageUrls && selectedCarousel.imageUrls.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider block">Slide Assets</span>
                    <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                      {selectedCarousel.imageUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-mono text-link hover:underline bg-muted/50 border border-hairline px-1.5 py-0.5 rounded flex items-center gap-1"
                        >
                          S{i+1} <ExternalLink className="size-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text fields & Actions */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Caption &amp; Hashtags</span>
                    <div className="text-xs font-mono p-3 bg-muted/20 border border-hairline rounded-xl max-h-[220px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                      {selectedCarousel.caption}
                    </div>
                  </div>

                  {selectedCarousel.dueAt && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-amber-500 animate-pulse" />
                        <div className="leading-none">
                          <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-widest block">Scheduled Time</span>
                          <span className="text-xs font-mono font-bold">
                            {new Date(selectedCarousel.dueAt).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                      
                      {selectedCarousel.status !== "posted" && selectedCarousel.status !== "scheduled" && (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase leading-none font-mono">
                          Ready to Send
                        </span>
                      )}
                      
                      {(selectedCarousel.bufferIgId || selectedCarousel.bufferTtId) && (
                        <div className="text-right">
                          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest block">Buffer Link</span>
                          <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 font-semibold">
                            <CheckCircle className="size-3" /> Scheduled in Buffer
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                  {/* Reschedule Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => {
                      setSchedulingTarget(selectedCarousel.id);
                      if (selectedCarousel.dueAt) {
                        setScheduleTime(selectedCarousel.dueAt.substring(0, 16));
                      } else {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(9, 0, 0, 0);
                        const pad = (n: number) => String(n).padStart(2, "0");
                        setScheduleTime(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`);
                      }
                      setSelectedCarousel(null);
                    }}
                  >
                    Reschedule / Set Date
                  </Button>

                  {/* Publish/Upload to Buffer Action */}
                  {selectedCarousel.dueAt && selectedCarousel.status !== "posted" && (
                    <Button
                      size="sm"
                      className="font-mono text-xs gap-1.5"
                      onClick={() => handlePublishToBuffer(selectedCarousel)}
                      disabled={publishingId === selectedCarousel.id}
                    >
                      {publishingId === selectedCarousel.id ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 text-emerald-500 fill-emerald-500" />
                          Upload to Buffer
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
