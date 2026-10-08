"use client";

import { Toaster } from "@/components/ui/sonner";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

/**
 * The kit's Toaster asks next-themes for the theme, and this app keeps the theme in the
 * preferences store instead — so pass the resolved mode in, or toasts follow the OS.
 */
export function AppToaster() {
  const theme = usePreferencesStore((s) => s.resolvedThemeMode);
  return <Toaster theme={theme} position="bottom-right" />;
}
