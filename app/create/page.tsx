import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { availableModels } from "@/lib/ai/registry";
import { Wizard } from "./wizard";

export default async function CreatePage() {
  await requireSession();
  const models = availableModels();
  return (
    <main className="mx-auto max-w-[1400px] min-h-screen p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0 border-b border-hairline pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="size-10 rounded-full overflow-hidden bg-[#07070e] border border-white/20 shadow-md shrink-0 hover:scale-105 transition-transform">
            <img src="/vourdev-logo.jpeg" alt="@vourdev" className="size-full object-cover" />
          </Link>
          <div>
            <h1 className="text-[24px] md:text-[28px] tracking-tight font-bold leading-tight">
              <span className="gradient-text">Create</span> carousel
            </h1>
            <p className="text-xs text-muted-foreground">Studio pembuatan dan penjadwalan carousel @vourdev</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground bg-card border border-hairline rounded-lg px-3 py-2 transition-colors shadow-2xs"
          >
            <ArrowLeft className="size-3.5" /> Back ke Kalender
          </Link>
        </div>
      </div>
      <Wizard models={models} />
    </main>
  );
}
