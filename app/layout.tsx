import type { Metadata } from "next";

import { AppToaster } from "@/components/app-toaster";
import { ErrorConsole } from "@/components/error-console";
import { ThemeBootScript } from "@/components/theme-boot";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fontVars } from "@/lib/fonts/registry";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Vour Carousels", template: "%s · Vour" },
  description: "On-brand @vourdev carousel builder",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;
  return (
    <html
      lang="id"
      className="dark"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        {/* Applies saved theme and layout preferences before paint: no flash, no server rerender. */}
        <ThemeBootScript />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <TooltipProvider>
          <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
            {children}
            <AppToaster />
            <ErrorConsole />
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
