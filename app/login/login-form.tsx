"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { signIn } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await signIn.email({ email, password });
    setPending(false);
    if (res.error) {
      setError("Email atau password salah.");
      return;
    }
    router.push("/");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field className="gap-1.5" data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@vour.dev"
            aria-invalid={Boolean(error)}
            required
          />
        </Field>
        <Field className="gap-1.5" data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={Boolean(error)}
              required
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FieldGroup>
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
        {pending ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
}
