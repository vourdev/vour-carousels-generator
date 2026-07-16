import { requireSession } from "@/lib/session";
import { listCarousels } from "@/lib/history/repo";
import HistoryClient from "./history-client";

export default async function HistoryPage() {
  const session = await requireSession();
  const items = await listCarousels(session.user.id);

  return (
    <HistoryClient
      initialItems={items}
      userId={session.user.id}
      betterAuthSecret={process.env.BETTER_AUTH_SECRET || ""}
    />
  );
}
