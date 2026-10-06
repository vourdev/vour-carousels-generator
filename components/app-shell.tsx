import { AppSidebar } from "@/components/app-sidebar";

/**
 * Every signed-in page sits in this frame: the sidebar on the left, the page in a column
 * that owns its own scrolling. Pages that need the full height (the Create studio) pass
 * `fill`, and lay themselves out inside it instead of scrolling.
 */
export function AppShell({
  email,
  fill = false,
  children,
}: {
  email: string;
  fill?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-background md:flex-row">
      <AppSidebar email={email} />
      <main className={fill ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" : "min-h-0 min-w-0 flex-1 overflow-y-auto"}>
        {children}
      </main>
    </div>
  );
}
