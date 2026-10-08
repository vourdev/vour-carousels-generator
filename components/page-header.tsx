import { cn } from "@/lib/utils";

/**
 * The title row a dashboard page opens with, inside the padded content area.
 * Wraps rather than switching at a breakpoint: the actions drop under the title only when
 * they would squeeze it, which depends on how many actions the page has.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0 flex-[1_1_16rem] space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
