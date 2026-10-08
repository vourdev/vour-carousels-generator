"use client";

import { useEffect, useMemo, useState } from "react";

import { type EventInput, useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import idLocale from "@fullcalendar/react/locales/id";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { carouselStatusColor } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Carousel } from "@/lib/history/repo";

const VIEWS = [
  { key: "dayGridMonth", label: "Bulan" },
  { key: "timeGridWeek", label: "Minggu" },
  { key: "listMonth", label: "Agenda" },
] as const;

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];

/**
 * Scheduled decks on the admin template's FullCalendar. A deck is an event at its publish
 * time, coloured by status; clicking it opens the deck. Phones start on the agenda list —
 * a month grid at 375px leaves each title three letters.
 */
export function ScheduleCalendar({
  items,
  onSelect,
}: {
  items: Carousel[];
  onSelect: (carousel: Carousel) => void;
}) {
  const controller = useCalendarController();
  const isMobile = useIsMobile();
  const [info, setInfo] = useState({ title: "", start: new Date(0), end: new Date(0) });

  const byId = useMemo(() => new Map(items.map((c) => [c.id, c])), [items]);
  const events = useMemo<EventInput[]>(
    () =>
      items
        .filter((c) => c.dueAt)
        .map((c) => ({
          id: c.id,
          title: c.title || "Untitled",
          start: c.dueAt as string,
          // A post is a moment, not a meeting: 30 minutes keeps the week view readable.
          end: new Date(Date.parse(c.dueAt as string) + 30 * 60_000).toISOString(),
          color: carouselStatusColor(c.status),
          textColor: "oklch(0.21 0 0)",
        })),
    [items],
  );

  useEffect(() => {
    if (isMobile && controller.view?.type === "dayGridMonth") controller.changeView("listMonth");
  }, [isMobile, controller]);

  const inRange = events.filter((e) => {
    const t = Date.parse(String(e.start));
    return t >= info.start.getTime() && t < info.end.getTime();
  }).length;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 shrink-0 flex-col gap-1">
          <div className="font-medium text-lg capitalize leading-none">{info.title}</div>
          <p className="text-muted-foreground text-sm">{inRange} posting dalam rentang ini</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonGroup>
            <Button size="icon" variant="outline" onClick={() => controller.prev()} aria-label="Sebelumnya">
              <ChevronLeft />
            </Button>
            <Button variant="outline" onClick={() => controller.today()}>
              Hari ini
            </Button>
            <Button size="icon" variant="outline" onClick={() => controller.next()} aria-label="Berikutnya">
              <ChevronRight />
            </Button>
          </ButtonGroup>
          <Select value={controller.view?.type ?? VIEWS[0].key} onValueChange={(v) => controller.changeView(v)}>
            <SelectTrigger className="w-32" aria-label="Tampilan kalender">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {VIEWS.map((v) => (
                  <SelectItem key={v.key} value={v.key}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <EventCalendarViews
        controller={controller}
        initialView={VIEWS[0].key}
        plugins={plugins}
        locale={idLocale}
        firstDay={1}
        height="auto"
        dayMaxEvents={3}
        popoverCloseContent={() => <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />}
        events={events}
        nowIndicator
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventClick={(arg) => {
          arg.jsEvent.preventDefault();
          const c = byId.get(arg.event.id);
          if (c) onSelect(c);
        }}
        datesSet={(arg) => setInfo({ title: arg.view.title, start: arg.start, end: arg.end })}
      />
    </div>
  );
}
