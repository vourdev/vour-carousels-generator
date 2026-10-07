import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { listCarousels } from "@/lib/history/repo";
import { AppShell } from "@/components/app-shell";
import HistoryClient from "./history-client";

export const metadata: Metadata = { title: "Calendar" };

export default async function HistoryPage() {
  const session = await requireSession();
  const items = await listCarousels(session.user.id, 200);

  return (
    <AppShell email={session.user.email}>
      <HistoryClient initialItems={items} />
    </AppShell>
  );
}
