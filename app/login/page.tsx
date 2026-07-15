"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn.email({ email, password });
    if (res.error) {
      setError("Invalid credentials");
      return;
    }
    router.push("/");
  }

  return (
    <main style={{ maxWidth: 360, margin: "20vh auto", padding: 24 }}>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Vour Carousels</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email" placeholder="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, border: "1px solid var(--ed-ink-faint)", borderRadius: 8 }}
        />
        <input
          type="password" placeholder="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12, border: "1px solid var(--ed-ink-faint)", borderRadius: 8 }}
        />
        <button
          type="submit"
          style={{ padding: 12, background: "var(--ed-orange)", color: "#fff", border: 0, borderRadius: 8 }}
        >
          Sign in
        </button>
        {error && <p style={{ color: "var(--ed-orange)" }}>{error}</p>}
      </form>
    </main>
  );
}
