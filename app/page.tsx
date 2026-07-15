import { requireSession } from "@/lib/session";
import { LogoutButton } from "./logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Sparkles, Layout, ArrowRight, Lightbulb, BookOpen } from "lucide-react";

export default async function Home() {
  const session = await requireSession();
  
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-canvas flex flex-col">
      
      {/* Top Header Navbar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="font-heading text-lg font-bold tracking-tight">
              <span className="gradient-text">Vour</span> Carousels
            </span>
            <span className="text-[10px] bg-primary/10 text-primary font-mono font-medium px-2 py-0.5 rounded-full border border-primary/20">
              SaaS v1.0
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="text-muted-foreground">Logged in as</span>
              <span className="font-medium text-foreground">{session.user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Workspace Launcher Content */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-6 lg:py-4 flex flex-col justify-center gap-8 lg:gap-6 min-h-0 overflow-y-auto">
        
        {/* Welcome Section */}
        <section className="text-center md:text-left flex flex-col gap-3 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
            Selamat datang kembali di <span className="gradient-text">Workspace</span> Anda
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Rancang deck slide edukatif yang interaktif untuk developer dan audiens teknis secara cepat menggunakan bantuan kecerdasan buatan (AI) atau berkas markdown Anda.
          </p>
        </section>

        {/* Action Panel Grid */}
        <section className="grid md:grid-cols-2 gap-6 w-full">
          
          {/* Card 1: AI Carousel Generator */}
          <Card className="hover:border-primary/40 hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="size-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading text-lg font-bold leading-tight flex items-center gap-2">
                  AI Carousel Creator
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-mono font-medium">RECOMMENDED</span>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tulis konsep ide, unggah berkas markdown, atau edit draf outline secara real-time pada editor split-screen kami, lalu biarkan AI merancang slide visual Anda secara instan.
                </p>
              </div>
              <div className="pt-2">
                <Button nativeButton={false} render={<Link href="/create" />} className="w-full justify-between h-9 text-xs group/btn">
                  <span>Mulai Generator AI</span>
                  <ArrowRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Interactive Sandbox */}
          <Card className="hover:border-primary/40 hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Layout className="size-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading text-lg font-bold leading-tight">
                  Design Sandbox & Preview
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Uji sampel layout, sesuaikan skema warna tema, salin rancangan kode CSS yang sudah dioptimalkan, serta unduh slide deck langsung ke komputer Anda.
                </p>
              </div>
              <div className="pt-2">
                <Button nativeButton={false} render={<Link href="/preview" />} className="w-full justify-between h-9 text-xs group/btn" variant="secondary">
                  <span>Buka Preview & Sandbox</span>
                  <ArrowRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

        </section>

        {/* Brand System Rules and Tips */}
        <section className="w-full">
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
              
              <div className="flex items-center gap-2 text-primary shrink-0">
                <Lightbulb className="size-5 text-amber-500 shrink-0" />
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider">Vour Design Guidelines</h4>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 flex-1 text-xs text-muted-foreground leading-relaxed">
                <div className="flex gap-2">
                  <span className="text-amber-500 shrink-0">✨</span>
                  <p><strong>Slide Eyebrows:</strong> Pastikan teks eyebrow maksimal terdiri dari 3 kata dan ditulis dalam huruf besar (ALL CAPS).</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-500 shrink-0">✨</span>
                  <p><strong>Headline Accent:</strong> Gunakan tepat satu kata penekanan (accentWord) per headline untuk memandu fokus audiens.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-500 shrink-0">✨</span>
                  <p><strong>Slide Descriptions:</strong> Batasi deskripsi hingga &plusmn;120 karakter agar teks tidak terpotong dan pas pada layout kartu.</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-card/30 shrink-0">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>&copy; 2026 vourdev. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="https://github.com" className="hover:text-foreground transition-colors flex items-center gap-1">
              <BookOpen className="size-3.5" /> Dokumentasi
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
