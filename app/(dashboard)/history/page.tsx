import type { Metadata } from "next";

import { listCarousels } from "@/lib/history/repo";
import { requireSession } from "@/lib/session";

import HistoryClient from "./history-client";

export const metadata: Metadata = { title: "Calendar" };

export default async function HistoryPage() {
  const session = await requireSession();
  const items = await listCarousels(session.user.id, 200);
  return <HistoryClient initialItems={items} />;
}
