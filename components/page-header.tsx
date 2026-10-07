import { cn } from "@/lib/utils";

/** The title row every page opens with. Navigation lives in the sidebar, not here. */
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
    <div
      className={cn(
        // Wraps instead of switching at a breakpoint: the actions drop under the title only
        // when they would squeeze it, which depends on how many actions the page has.
        "flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-4 py-4 md:px-6",
        className
      )}
    >
      <div className="min-w-0 flex-[1_1_16rem]">
        <h1 className="text-lg font-semibold tracking-tight text-balance">{title}</h1>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
