import { requireSession } from "@/lib/session";
import { availableModels } from "@/lib/ai/registry";
import { Wizard } from "./wizard";

export default async function CreatePage() {
  await requireSession();
  const models = availableModels();
  return (
    <main className="mx-auto mt-[4vh] max-w-[720px] p-6">
      <h1 className="mb-4 text-[32px] tracking-tight">
        <span className="gradient-text">Create</span> carousel
      </h1>
      <Wizard models={models} />
    </main>
  );
}
