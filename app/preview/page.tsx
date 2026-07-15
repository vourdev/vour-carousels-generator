import { requireSession } from "@/lib/session";
import { PreviewSandbox } from "./preview-sandbox";

export default async function PreviewPage() {
  await requireSession();
  
  return (
    <main className="mx-auto max-w-[1400px] w-full p-6 lg:h-screen lg:overflow-hidden flex flex-col min-h-screen">
      
      {/* Page Header */}
      <h1 className="mb-4 text-[32px] tracking-tight shrink-0">
        <span className="gradient-text">Design</span> Sandbox
      </h1>

      {/* Sandbox Component Workspace */}
      <PreviewSandbox />

    </main>
  );
}
