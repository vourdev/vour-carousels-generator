import { requireSession } from "@/lib/session";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const session = await requireSession();
  return (
    <main className="mx-auto mt-[10vh] max-w-[720px] p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[40px] tracking-tight">
          <span className="gradient-text">Vour</span> Carousels
        </h1>
        <LogoutButton />
      </div>
      <p className="mt-4 text-body">
        Signed in as {session.user.email}. Open{" "}
        <a href="/preview" className="text-link">
          /preview
        </a>{" "}
        to see a sample carousel.
      </p>
    </main>
  );
}
