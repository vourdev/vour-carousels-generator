import { Badge } from "@/components/ui/badge";
import type { CarouselStatus } from "@/lib/history/repo";
import type { TopicStatus } from "@/lib/topics/bank";
import { cn } from "@/lib/utils";

/**
 * One status vocabulary for the whole app. A colour means the same thing on every page:
 * grey is idle, sky is ready, amber is waiting on time or on a person, green is done,
 * red needs attention. Styled like the admin template's task statuses.
 */
type Tone = "muted" | "info" | "warning" | "success" | "danger";

const TONE: Record<Tone, string> = {
  muted: "border-muted-foreground/20 bg-muted text-muted-foreground",
  info: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  success: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
};

const DOT: Record<Tone, string> = {
  muted: "bg-muted-foreground/60",
  info: "bg-sky-500",
  warning: "bg-amber-500",
  success: "bg-green-500",
  danger: "bg-destructive",
};

export const CAROUSEL_STATUS: Record<CarouselStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "muted" },
  exported: { label: "Exported", tone: "info" },
  scheduled: { label: "Scheduled", tone: "warning" },
  posted: { label: "Posted", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

export const TOPIC_STATUS: Record<TopicStatus, { label: string; tone: Tone }> = {
  idea: { label: "Idea", tone: "muted" },
  queued: { label: "Queued", tone: "info" },
  generated: { label: "Generated", tone: "warning" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "muted" },
};

function StatusBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-sm border font-medium", TONE[tone], className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[tone])} />
      {label}
    </Badge>
  );
}

export function CarouselStatusBadge({ status, className }: { status: CarouselStatus; className?: string }) {
  const s = CAROUSEL_STATUS[status] ?? { label: status, tone: "muted" as Tone };
  return <StatusBadge {...s} className={className} />;
}

export function TopicStatusBadge({ status, className }: { status: TopicStatus; className?: string }) {
  const s = TOPIC_STATUS[status] ?? { label: status, tone: "muted" as Tone };
  return <StatusBadge {...s} className={className} />;
}

/** The dot alone, for places too small for a word, like a calendar cell. */
export function CarouselStatusDot({ status }: { status: CarouselStatus }) {
  const tone = CAROUSEL_STATUS[status]?.tone ?? "muted";
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])} />;
}

/** The colour of a status, for event chips in the calendar. */
export function carouselStatusColor(status: CarouselStatus): string {
  const tone = CAROUSEL_STATUS[status]?.tone ?? "muted";
  // Tailwind palette values (zinc/sky/amber/green-500): a theme variable is only emitted
  // when some utility uses it, so referencing var(--color-*) here could resolve to nothing.
  return {
    muted: "oklch(55.2% 0.016 285.938)",
    info: "oklch(68.5% 0.169 237.323)",
    warning: "oklch(76.9% 0.188 70.08)",
    success: "oklch(72.3% 0.219 149.579)",
    danger: "var(--destructive)",
  }[tone];
}
