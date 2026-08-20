import { requireSession } from "@/lib/session";
import { listModelsAction } from "./create/actions";
import { LogoutButton } from "./logout-button";
import { KeyboardNav } from "./keyboard-nav";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Clock, Calendar, CheckCircle2, Zap, Layers, Share2, Brain, Globe, Lightbulb } from "lucide-react";

const gradientBorder: React.CSSProperties = {
  padding: 1,
  background: "linear-gradient(120deg, #007cf0, #7928ca, #ff0080)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

export default async function Home() {
  const session = await requireSession();
  // A dead backend should degrade this panel to "none configured", not 500 the homepage.
  const models = await listModelsAction().catch(() => []);
  const handle = session.user.email.split("@")[0];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col justify-between">
      <KeyboardNav />

      {/* Decorative Gradient Background Elements */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 size-[600px] rounded-full opacity-25 blur-[120px] motion-safe:animate-pulse"
        style={{
          background:
            "conic-gradient(from 160deg, #007cf0, #7928ca, #ff0080, #f9cb28, #00dfd8, #007cf0)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/2 size-[500px] -translate-y-1/2 rounded-full opacity-15 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, #7928ca 0%, #007cf0 60%, transparent 100%)",
        }}
      />

      {/* Dotted Subtle Background Grid Pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* HEADER BAR */}
      <header className="relative z-10 mx-auto max-w-6xl w-full px-6 py-6 flex items-center justify-between border-b border-hairline/60">
        <div className="flex items-center gap-3">
          <Link href="/" className="size-10 rounded-full overflow-hidden bg-[#07070e] border border-white/20 shadow-md shrink-0 hover:scale-105 transition-transform">
            <img src="/vourdev-logo.jpeg" alt="@vourdev" className="size-full object-cover" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm">vourdev studio</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                ● v2.0
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">AI Carousel Generator &amp; Buffer Scheduler</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted-foreground bg-card/60 border border-hairline px-3 py-1.5 rounded-xl backdrop-blur-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{session.user.email}</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 mx-auto max-w-6xl w-full px-6 py-12 md:py-16 flex flex-col gap-12 my-auto">
        <div className="flex flex-col items-start gap-6 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-muted/60 border border-hairline text-foreground/80 backdrop-blur-xs shadow-2xs">
            <Sparkles className="size-3.5 text-indigo-500" />
            <span>Ready — Halo, <strong className="text-foreground">{handle}</strong></span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Otomatisasi Carousel <br />
            <span className="gradient-text">Studio Cerdas.</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Ubah ide topik sederhana menjadi <strong className="text-foreground font-medium">carousel slide visual 1080x1350</strong> beresolusi tinggi. Dipandu AI multi-provider, editor brief fleksibel, dan terhubung langsung ke jadwal <strong className="text-foreground font-medium">Buffer API</strong>.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/create"
              className="group relative inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="size-4" />
              <span>Mulai Buat Carousel</span>
              <kbd className="ml-2 rounded bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-mono text-primary-foreground">
                C
              </kbd>
            </Link>

            <Link
              href="/topics"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-card border border-hairline text-foreground font-medium text-sm hover:bg-muted/50 transition-colors shadow-2xs"
            >
              <Lightbulb className="size-4 text-muted-foreground" />
              <span>Topic Bank</span>
              <kbd className="ml-2 rounded border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                T
              </kbd>
            </Link>

            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-card border border-hairline text-foreground font-medium text-sm hover:bg-muted/50 transition-colors shadow-2xs"
            >
              <Calendar className="size-4 text-muted-foreground" />
              <span>History</span>
              <kbd className="ml-2 rounded border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                H
              </kbd>
            </Link>
          </div>
        </div>

        {/* FEATURE HIGHLIGHT TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Tile 0: Topic Bank */}
          <Link
            href="/topics"
            className="group relative overflow-hidden rounded-3xl border border-hairline bg-card/50 p-6 md:p-8 backdrop-blur-md transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl hover:-translate-y-1"
          >
            <span aria-hidden style={gradientBorder} className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Lightbulb className="size-6" />
              </div>
              <kbd className="rounded-xl border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground">
                Shortcut T
              </kbd>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Topic Bank
                <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Generate 7 topic ideas per minggu via AI. Kelola content calendar dan queue topics untuk daily posting.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                AI Topic Generator
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                Weekly Planner
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                Batch Brief Gen
              </span>
            </div>
          </Link>

          {/* Tile 1: Create Studio */}
          <Link
            href="/create"
            className="group relative overflow-hidden rounded-3xl border border-hairline bg-card/50 p-6 md:p-8 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
          >
            <span aria-hidden style={gradientBorder} className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                <Sparkles className="size-6" />
              </div>
              <kbd className="rounded-xl border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground">
                Shortcut C
              </kbd>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Carousel Studio Wizard
                <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Alur 5 langkah terfokus: Ide Topik → AI Brief → Live Design Canvas → High-Res Export → Schedule Buffer.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                AI Brief Prompting
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                Live Canvas Frame
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                JPEG ZIP Batch
              </span>
            </div>
          </Link>

          {/* Tile 2: History Calendar */}
          <Link
            href="/history"
            className="group relative overflow-hidden rounded-3xl border border-hairline bg-card/50 p-6 md:p-8 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:-translate-y-1"
          >
            <span aria-hidden style={gradientBorder} className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Clock className="size-6" />
              </div>
              <kbd className="rounded-xl border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground">
                Shortcut H
              </kbd>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Content Calendar &amp; History
                <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Pantau riwayat posting, kelola jadwal tayang di kalender interaktif, dan lacak status terunggah ke Buffer.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                Buffer Post IDs
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                Stock Content Draf
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-hairline">
                Calendar Schedule
              </span>
            </div>
          </Link>
        </div>

        {/* SUPPORTED PROVIDERS RIBBON */}
        <div className="bg-card/40 border border-hairline rounded-3xl p-6 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Zap className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Provider Ready</h4>
              <p className="text-xs text-foreground font-medium mt-0.5">
                Model AI aktif yang terkonfigurasi di sistem Anda:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {models.length > 0 ? (
              models.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-card border border-hairline text-foreground shadow-2xs capitalize"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {m}
                </span>
              ))
            ) : (
              <span className="text-xs font-mono text-destructive bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-xl">
                Tidak ada model aktif (set OMNIROUTE_API_KEY di backend)
              </span>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 mx-auto max-w-6xl w-full px-6 py-6 border-t border-hairline/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
        <p>© 2026 @vourdev carousel studio. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span>Tekan</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-bold text-foreground">T</kbd>
          <span>Topic Bank,</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-bold text-foreground">C</kbd>
          <span>Create,</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-bold text-foreground">H</kbd>
          <span>History</span>
        </p>
      </footer>
    </div>
  );
}
