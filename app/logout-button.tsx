"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/login");
      }}
      style={{ padding: "8px 16px", background: "var(--ed-ink)", color: "#fff", border: 0, borderRadius: 8 }}
    >
      Sign out
    </button>
  );
}
