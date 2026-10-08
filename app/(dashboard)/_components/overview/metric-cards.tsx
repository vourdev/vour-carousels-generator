import Link from "next/link";

import { ArrowUpRight, CalendarClock, ListTodo, Package, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface Metric {
  id: string;
  label: string;
  value: number;
  note: string;
  /** A short tag next to the number — e.g. "2 gagal" — or nothing. */
  flag?: { text: string; tone: "default" | "destructive" };
  href: string;
}

const ICONS = { scheduled: CalendarClock, stock: Package, posted: Send, queue: ListTodo } as const;

export function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {metrics.map((m) => {
        const Icon = ICONS[m.id as keyof typeof ICONS] ?? Package;
        return (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle>
                <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </CardTitle>
              <CardDescription>{m.label}</CardDescription>
              <CardAction>
                <Link
                  href={m.href}
                  aria-label={`Buka ${m.label}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{m.value}</div>
                {m.flag ? <Badge variant={m.flag.tone}>{m.flag.text}</Badge> : null}
              </div>
              <p className="truncate text-muted-foreground text-sm">{m.note}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
