import type { ReactNode } from "react";

import { cookies } from "next/headers";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getPreference } from "@/lib/preferences/server-actions";
import { requireSession } from "@/lib/session";
import { cn } from "@/lib/utils";

import { LayoutControls } from "./_components/header/layout-controls";
import { SearchDialog } from "./_components/header/search-dialog";
import { ThemeSwitcher } from "./_components/header/theme-switcher";
import { AppSidebar } from "./_components/sidebar/app-sidebar";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [session, cookieStore, variant, collapsible] = await Promise.all([
    requireSession(),
    cookies(),
    getPreference("sidebar_variant"),
    getPreference("sidebar_collapsible"),
  ]);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={{ "--sidebar-width": "calc(var(--spacing) * 64)" } as React.CSSProperties}
    >
      <AppSidebar
        variant={variant}
        collapsible={collapsible}
        user={{ name: session.user.name ?? "", email: session.user.email }}
      />
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&>*]:mx-auto",
          "[html[data-content-layout=centered]_&>*]:w-full",
          "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
          "peer-data-[variant=inset]:border",
          "[--dashboard-header-height:--spacing(12)]",
          // The inset variant floats the page with an 8px margin all round; full-height pages
          // (the Create studio) subtract it so they end at the frame, not past it.
          "[--inset-offset:0px] md:peer-data-[variant=inset]:[--inset-offset:1rem]",
          "min-w-0 overflow-x-clip",
        )}
      >
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear",
            "[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-40 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
          )}
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <SearchDialog />
            </div>
            <div className="flex items-center gap-1">
              <LayoutControls />
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        {/* Pages can set data-content-padding="false" to render full-bleed app layouts. */}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
