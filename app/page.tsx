import { requireSession } from "@/lib/session";
import { availableModels } from "@/lib/ai/registry";
import { LogoutButton } from "./logout-button";
import { KeyboardNav } from "./keyboard-nav";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Clock } from "lucide-react";

const gradientBorder: React.CSSProperties = {
  padding: 1,
  background: "linear-gradient(120deg, #007cf0, #7928ca, #ff0080)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

function LaunchTile({
  href,
  kbd,
  title,
  desc,
  icon,
}: {
  href: string;
  kbd: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-colors hover:border-transparent"
    >
      <span aria-hidden style={gradientBorder} className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
          {icon}
        </span>
        <kbd className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {kbd}
        </kbd>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <ArrowUpRight className="absolute bottom-5 right-5 size-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

export default async function Home() {
  const session = await requireSession();
  const models = availableModels();
  const handle = session.user.email.split("@")[0];

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <KeyboardNav />

      {/* Live mesh aura — the one decorative device, used bold. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-48 size-[560px] rounded-full opacity-30 blur-[110px] motion-safe:animate-pulse"
        style={{
          background:
            "conic-gradient(from 160deg, #007cf0, #7928ca, #ff0080, #f9cb28, #00dfd8, #007cf0)",
        }}
      />
      {/* Dotted grid. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <span className="font-mono text-xs text-muted-foreground">~/vourdev</span>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            {session.user.email}
          </span>
          <LogoutButton />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-152px)] max-w-4xl flex-col justify-center px-6">
        <p className="mb-5 font-mono text-sm text-muted-foreground">
          <span className="text-emerald-500">●</span> ready — halo, {handle}
        </p>

        <h1 className="text-5xl font-semibold leading-[0.92] tracking-tighter sm:text-7xl">
          Carousel
          <br />
          <span className="gradient-text">studio.</span>
          <span className="ml-1 inline-block h-[0.85em] w-[3px] translate-y-1 bg-current align-middle motion-safe:animate-pulse" />
        </h1>

        <p className="mt-6 max-w-md font-mono text-sm leading-relaxed text-muted-foreground">
          idea → AI brief → HTML → export → buffer. semua dari satu tempat.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <LaunchTile
            href="/create"
            kbd="C"
            title="Create"
            desc="ide jadi carousel, dipandu AI"
            icon={<Sparkles className="size-4" />}
          />
          <LaunchTile
            href="/history"
            kbd="H"
            title="History"
            desc="lacak konten & status Buffer"
            icon={<Clock className="size-4" />}
          />
        </div>

        <p className="mt-8 font-mono text-xs text-muted-foreground">
          model:{" "}
          {models.length ? (
            <span className="text-foreground">{models.join(" · ")}</span>
          ) : (
            <span className="text-destructive">none — set GOOGLE_GENERATIVE_AI_API_KEY</span>
          )}
        </p>
      </main>
    </div>
  );
}
