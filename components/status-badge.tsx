import { cn } from "@/lib/utils";
import type { CarouselStatus } from "@/lib/history/repo";
import type { TopicStatus } from "@/lib/topics/bank";

/**
 * One status vocabulary for the whole app. A colour means the same thing on every page:
 * grey is idle, blue is ready, amber is waiting on time or on a person, green is done,
 * red needs attention. The colour lives only in the dot, so a column of badges reads as a
 * list of words rather than a row of coloured pills.
 */
type Tone = "muted" | "info" | "warning" | "success" | "danger";

const DOT: Record<Tone, string> = {
  muted: "bg-muted-foreground/60",
  info: "bg-link",
  warning: "bg-warning",
  success: "bg-emerald-600 dark:bg-emerald-500",
  danger: "bg-destructive",
};

const CAROUSEL: Record<CarouselStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "muted" },
  exported: { label: "Exported", tone: "info" },
  scheduled: { label: "Scheduled", tone: "warning" },
  posted: { label: "Posted", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

const TOPIC: Record<TopicStatus, { label: string; tone: Tone }> = {
  idea: { label: "Idea", tone: "muted" },
  queued: { label: "Queued", tone: "info" },
  generated: { label: "Generated", tone: "warning" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "muted" },
};

function Badge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2 text-xs font-medium text-foreground",
        className
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[tone])} />
      {label}
    </span>
  );
}

export function CarouselStatusBadge({ status, className }: { status: CarouselStatus; className?: string }) {
  const s = CAROUSEL[status] ?? { label: status, tone: "muted" as Tone };
  return <Badge {...s} className={className} />;
}

export function TopicStatusBadge({ status, className }: { status: TopicStatus; className?: string }) {
  const s = TOPIC[status] ?? { label: status, tone: "muted" as Tone };
  return <Badge {...s} className={className} />;
}

/** The dot alone, for places too small for a word, like a calendar cell. */
export function CarouselStatusDot({ status }: { status: CarouselStatus }) {
  const tone = CAROUSEL[status]?.tone ?? "muted";
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])} />;
}
