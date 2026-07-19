import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { availableModels } from "@/lib/ai/registry";
import { Wizard } from "./wizard";

export default async function CreatePage() {
  await requireSession();
  const models = availableModels();
  return (
    <main className="mx-auto max-w-[1400px] p-6 lg:h-screen lg:overflow-hidden flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0 border-b border-hairline pb-4">
        <div>
          <h1 className="text-[28px] md:text-[32px] tracking-tight font-bold">
            <span className="gradient-text">Create</span> carousel
          </h1>
          <p className="text-xs text-muted-foreground">Studio pembuatan dan penjadwalan carousel</p>
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
