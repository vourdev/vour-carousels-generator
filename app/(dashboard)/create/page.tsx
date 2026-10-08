import type { Metadata } from "next";

import { requireSession } from "@/lib/session";
import { getTopic } from "@/lib/topics/bank";

import { listModelsAction } from "./actions";
import { Wizard } from "./wizard";

export const metadata: Metadata = { title: "Create carousel" };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const [session, { topic: topicId }] = await Promise.all([requireSession(), searchParams]);
  // Whatever the backend reports, minus the retired ids it still resolves for saved records.
  const models = (await listModelsAction()).filter((m) => m !== "vour-lite" && m !== "gemini");
  const initialTopic = topicId ? await getTopic(topicId, session.user.id) : null;
  return (
    // Full-bleed and exactly one viewport tall: the studio scrolls its panes, not the page.
    <div
      data-content-padding="false"
      className="flex h-[calc(100svh-var(--dashboard-header-height)-var(--inset-offset))] min-h-0 flex-col p-3 md:p-4"
    >
      <Wizard models={models} initialTopic={initialTopic} />
    </div>
  );
}
