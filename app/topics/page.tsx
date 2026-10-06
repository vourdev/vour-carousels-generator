import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopicBank } from "./topic-bank";

export default async function TopicsPage() {
  const session = await requireSession();

  return (
    <AppShell email={session.user.email}>
      <PageHeader title="Topics" description="Bank ide konten: generate, antrekan, lalu jadikan carousel." />
      <div className="p-4 md:p-6">
        <TopicBank />
      </div>
    </AppShell>
  );
}
