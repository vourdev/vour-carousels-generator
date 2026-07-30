import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { TopicBank } from "./topic-bank";

export default async function TopicsPage() {
  await requireSession();
  
  return (
    <main className="mx-auto max-w-screen-xl min-h-screen p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0 border-b border-hairline pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="size-10 rounded-full overflow-hidden bg-[#07070e] border border-white/20 shadow-md shrink-0 hover:scale-105 transition-transform">
            <img src="/vourdev-logo.jpeg" alt="@vourdev" className="size-full object-cover" />
          </Link>
          <div>
            <h1 className="text-[24px] md:text-[28px] tracking-tight font-bold leading-tight">
              <span className="gradient-text">Topic Bank</span>
            </h1>
            <p className="text-xs text-muted-foreground">Kelola ide content & generate brief untuk daily posting</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground bg-card border border-hairline rounded-lg px-3 py-2 transition-colors shadow-2xs"
          >
            <ArrowLeft className="size-3.5" /> Back
          </Link>
        </div>
      </div>
      
      <TopicBank />
    </main>
  );
}
