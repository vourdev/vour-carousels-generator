import { requireSession } from "@/lib/session";
import { getTopic } from "@/lib/topics/bank";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { listModelsAction } from "./actions";
import { Wizard } from "./wizard";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [session, { topic: topicId }] = await Promise.all([requireSession(), searchParams]);
  // Whatever the backend reports, minus the retired ids it still resolves for saved records.
  const models = (await listModelsAction()).filter((m) => m !== "vour-lite" && m !== "gemini");
  const initialTopic = topicId ? await getTopic(topicId, session.user.id) : null;
  return (
    <AppShell email={session.user.email} fill>
      <PageHeader
        title="Create"
        description="Ide → brief → slide → ekspor → jadwal Buffer."
        className="py-3"
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3 md:p-4">
        <Wizard models={models} initialTopic={initialTopic} />
      </div>
    </AppShell>
  );
}
