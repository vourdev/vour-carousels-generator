"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, ListTodo, LogOut, Menu, PenSquare, X } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard, key: "o" },
  { href: "/create", label: "Create", icon: PenSquare, key: "c" },
  { href: "/topics", label: "Topics", icon: ListTodo, key: "t" },
  { href: "/history", label: "Calendar", icon: CalendarDays, key: "h" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Single-key jumps between pages, ignored while typing anywhere. */
function useShortcuts() {
  const router = useRouter();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (document.querySelector("[role=dialog]")) return;
      const hit = NAV.find((n) => n.key === e.key.toLowerCase());
      if (hit) router.push(hit.href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <img src="/vourdev-logo.jpeg" alt="" className="size-6 rounded-md" />
      <span className="text-sm font-semibold tracking-tight">vourdev</span>
      <span className="text-sm text-muted-foreground">Carousels</span>
    </Link>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon, key }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-keyshortcuts={key}
            className={cn(
              "group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <kbd aria-hidden className="hidden font-sans text-[11px] text-muted-foreground/70 uppercase md:inline">{key}</kbd>
          </Link>
        );
      })}
    </nav>
  );
}

function Account({ email }: { email: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2 border-t border-border px-2 pt-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-medium uppercase">
        {email.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={email}>
        {email}
      </span>
      <button
        type="button"
        aria-label="Sign out"
        title="Sign out"
        onClick={async () => {
          await signOut();
          router.push("/login");
        }}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  useShortcuts();

  useEffect(() => {
    if (!open) return;
    drawer.current?.querySelector<HTMLElement>("nav a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const trigger = menuButton.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      {/* Desktop: a fixed column. */}
      <aside className="hidden w-56 shrink-0 flex-col gap-4 border-r border-border bg-sidebar p-3 md:flex">
        <Brand />
        <div className="flex-1">
          <NavList pathname={pathname} />
        </div>
        <Account email={email} />
      </aside>

      {/* Mobile: a bar with the current page, and the same column as a drawer. */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-2 md:hidden">
        <button
          ref={menuButton}
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex size-8 items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="size-4" />
        </button>
        <Brand />
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside
            ref={drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-64 flex-col gap-4 border-r border-border bg-sidebar p-3 shadow-[4px_0_24px_rgb(0_0_0/0.12)]"
          >
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <Account email={email} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
