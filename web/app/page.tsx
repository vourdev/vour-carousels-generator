import { requireSession } from "@/lib/session";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const session = await requireSession();
  return (
    <main style={{ maxWidth: 720, margin: "10vh auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 56 }}>Vour Carousels</h1>
        <LogoutButton />
      </div>
      <p style={{ color: "var(--ed-ink-muted)", marginTop: 16 }}>
        Signed in as {session.user.email}. Carousel builder coming in Plan 2.
      </p>
    </main>
  );
}
