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
      className="h-8 rounded-pill border border-hairline bg-canvas px-3.5 text-sm font-medium text-ink"
    >
      Sign out
    </button>
  );
}
