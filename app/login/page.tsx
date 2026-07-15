"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

const inputClass =
  "h-10 rounded-md border border-hairline bg-canvas px-3 text-ink outline-none focus:border-ink";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await signIn.email({ email, password });
    setPending(false);
    if (res.error) {
      setError("Invalid credentials");
      return;
    }
    router.push("/");
  }

  return (
    <main className="mx-auto mt-[16vh] max-w-[380px] p-6">
      <h1 className="mb-1 text-[32px] tracking-tight">
        <span className="gradient-text">Vour</span> Carousels
      </h1>
      <p className="mb-6 font-mono text-xs text-mute">SIGN IN TO CONTINUE</p>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1.5 text-sm text-body">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm text-body">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-pill bg-primary font-medium text-on-primary disabled:opacity-70"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        {error && (
          <p role="alert" className="m-0 text-sm text-error">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
