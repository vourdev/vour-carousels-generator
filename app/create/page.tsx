import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getTopic } from "@/lib/topics/bank";
import { listModelsAction } from "./actions";
import { Wizard } from "./wizard";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [session, { topic: topicId }] = await Promise.all([requireSession(), searchParams]);
  const models = (await listModelsAction()).filter((m) => m === "vour-high" || m === "vour-lite");
  const initialTopic = topicId ? await getTopic(topicId, session.user.id) : null;
  return (
    <main className="mx-auto w-full max-w-7xl h-[100dvh] overflow-hidden p-3 md:p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between shrink-0 border-b border-hairline pb-2.5">
        <div className="flex items-center gap-3">
          <Link href="/" className="size-9 rounded-full overflow-hidden bg-[#07070e] border border-white/20 shadow-md shrink-0 hover:scale-105 transition-transform">
            <img src="/vourdev-logo.jpeg" alt="@vourdev" className="size-full object-cover" />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[22px] tracking-tight font-bold leading-tight">
              <span className="gradient-text">Create</span> carousel
            </h1>
            <p className="text-[11px] text-muted-foreground">Studio pembuatan dan penjadwalan carousel @vourdev</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground bg-card border border-hairline rounded-lg px-3 py-1.5 transition-colors shadow-2xs"
          >
            <ArrowLeft className="size-3.5" /> Back ke Kalender
          </Link>
        </div>
      </div>
      <Wizard models={models} initialTopic={initialTopic} />
    </main>
  );
}
