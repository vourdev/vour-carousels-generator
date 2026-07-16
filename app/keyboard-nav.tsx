"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Cockpit shortcuts: press C → /create, P → /preview (ignored while typing). */
export function KeyboardNav() {
  const router = useRouter();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === "c" || e.key === "C") router.push("/create");
      else if (e.key === "p" || e.key === "P") router.push("/preview");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
