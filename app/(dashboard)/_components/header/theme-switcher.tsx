"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

// Dark first: it is the default, so the first click must visibly change something.
const THEME_CYCLE = ["dark", "light", "system"] as const;

export function ThemeSwitcher() {
  const { themeMode, setPreference } = usePreferencesStore(
    useShallow((state) => ({ themeMode: state.values.theme_mode, setPreference: state.setPreference })),
  );

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(themeMode) + 1) % THEME_CYCLE.length];
    setPreference("theme_mode", next);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={cycleTheme}
      aria-label={`Tema: ${themeMode}. Klik untuk ganti`}
      title={`Tema: ${themeMode}`}
    >
      <Monitor className="hidden [html[data-theme-mode=system]_&]:block" />
      <Sun className="hidden dark:block [html[data-theme-mode=system]_&]:hidden" />
      <Moon className="block dark:hidden [html[data-theme-mode=system]_&]:hidden" />
    </Button>
  );
}
