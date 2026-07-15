import { requireSession } from "@/lib/session";
import { availableModels } from "@/lib/ai/registry";
import { Wizard } from "./wizard";

export default async function CreatePage() {
  await requireSession();
  const models = availableModels();
  return (
    <main className="mx-auto max-w-[1400px] p-6 lg:h-screen lg:overflow-hidden flex flex-col">
      <h1 className="mb-4 text-[32px] tracking-tight shrink-0">
        <span className="gradient-text">Create</span> carousel
      </h1>
      <Wizard models={models} />
    </main>
  );
}
