# Vour Carousels SaaS — Plan 1: Foundation + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a deployable, brand-themed Next.js app in `web/` that is fully login-gated by Better Auth with a single hardcoded (env-seeded) user and no public signup.

**Architecture:** New Next.js (App Router, TS, Tailwind) app under `web/`, isolated from the legacy Python pipeline and design-system folders at repo root. Better Auth handles username+password auth against a LibSQL/Turso store that holds ONLY the one user + sessions (carousel content stays stateless in later plans). Middleware + a server-side session check protect every app route. The SaaS UI adopts the Vour Dev editorial brand tokens from `DESIGN.md`.

**Tech Stack:** Next.js (App Router) · TypeScript · Tailwind · Better Auth · `@libsql/client` + `@libsql/kysely-libsql` (LibSQL/Turso) · Vitest.

## Global Constraints

- App root is `web/`. All paths in this plan are relative to repo root; the app's own imports use the `@/*` alias mapped to `web/`.
- Node 22, npm 10. Package manager: **npm** (no pnpm).
- Auth store persists ONLY the Better Auth user + session tables. No carousel/content persistence anywhere.
- Public signup is disabled: `emailAndPassword.disableSignUp` is `true` at runtime; seeding is the ONLY way a user is created.
- SaaS UI styling uses the `DESIGN.md §2/§3` editorial tokens verbatim — colors: `--ed-paper #FBF6EF`, `--ed-ink #1F0904`, `--ed-orange #E94B19` (accent only, never body text); fonts: Sora (display), Nunito (body), JetBrains Mono (mono). Never pure `#000` or `#fff`; never Inter/Poppins/Roboto.
- Every task ends green (`npm test` passing) and is committed.

---

### Task 1: Scaffold the `web/` app + Vitest

**Files:**
- Create: `web/` (via create-next-app)
- Create: `web/vitest.config.ts`
- Create: `web/test/smoke.test.ts`
- Modify: `web/package.json` (add scripts + deps)

**Interfaces:**
- Consumes: nothing.
- Produces: a Next.js app at `web/` with `@/*` → `web/` alias, and `npm test` running Vitest.

- [ ] **Step 1: Scaffold Next.js into `web/`**

Run from repo root:
```bash
npx create-next-app@latest web \
  --typescript --tailwind --app --eslint \
  --no-src-dir --import-alias "@/*" --use-npm --yes
```
Expected: `web/` created with `app/`, `package.json`, `tsconfig.json`, `next.config.*`, Tailwind wired.

- [ ] **Step 2: Add Vitest**

Run:
```bash
cd web && npm install -D vitest@^2 @vitejs/plugin-react
```

- [ ] **Step 3: Create `web/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, ".") } },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
  },
});
```

- [ ] **Step 4: Add the test script to `web/package.json`**

In `web/package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write the smoke test `web/test/smoke.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs the test runner", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run tests, expect PASS**

Run: `cd web && npm test`
Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
cd .. && git add web && git commit -m "feat: scaffold web app with Next.js + Vitest"
```

---

### Task 2: Editorial brand theme for the SaaS UI

**Files:**
- Modify: `web/app/globals.css`
- Create: `web/app/layout.tsx` (replace the generated one)
- Create: `web/test/theme.test.ts`

**Interfaces:**
- Consumes: Task 1 scaffold.
- Produces: CSS custom properties `--ed-paper`, `--ed-ink`, `--ed-orange`, `--ed-card-peach`, and font families `--font-display/body/mono` available globally; `<body>` uses `--ed-paper` bg + `--ed-ink` text.

- [ ] **Step 1: Write the failing test `web/test/theme.test.ts`**

This asserts the brand tokens are present in the global stylesheet (guards against regressing to the generic shadcn theme).

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");

describe("brand theme tokens", () => {
  it("defines the editorial palette from DESIGN.md", () => {
    expect(css).toContain("--ed-paper: #FBF6EF");
    expect(css).toContain("--ed-ink: #1F0904");
    expect(css).toContain("--ed-orange: #E94B19");
  });
  it("defines the brand font families", () => {
    expect(css).toContain("--font-display");
    expect(css).toContain("--font-body");
    expect(css).toContain("--font-mono");
  });
  it("does not keep the generic neutral background", () => {
    expect(css).not.toContain("--background: #ffffff");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd web && npx vitest run test/theme.test.ts`
Expected: FAIL (tokens not present).

- [ ] **Step 3: Replace `web/app/globals.css`**

```css
@import "tailwindcss";

:root {
  /* Editorial palette — DESIGN.md §2 */
  --ed-paper: #FBF6EF;
  --ed-paper-tint: #F4ECDE;
  --ed-ink: #1F0904;
  --ed-ink-soft: #3D1F15;
  --ed-ink-muted: #6E4B3E;
  --ed-ink-faint: #A48C7E;
  --ed-orange: #E94B19;
  --ed-orange-soft: #F2825D;
  --ed-card-peach: #FBE9D9;
  --ed-card-stone: #EDE7DA;
  --ed-card-mint: #E3F1E1;
  --ed-card-sky: #DEEAF7;
  --ed-card-pink: #F7DDE6;
  --ed-card-amber: #FBE7B0;

  /* Type families — DESIGN.md §3 */
  --font-display: "Sora", system-ui, sans-serif;
  --font-body: "Nunito", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

html, body {
  background: var(--ed-paper);
  color: var(--ed-ink);
  font-family: var(--font-body);
}

h1, h2, h3 { font-family: var(--font-display); }
```

- [ ] **Step 4: Replace `web/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vour Carousels",
  description: "On-brand @vourdev carousel builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Nunito:wght@500;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Run test, expect PASS**

Run: `cd web && npx vitest run test/theme.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
cd .. && git add web && git commit -m "feat: apply Vour Dev editorial brand theme to SaaS UI"
```

---

### Task 3: LibSQL client + Better Auth instance

**Files:**
- Create: `web/lib/db.ts`
- Create: `web/lib/auth.ts`
- Create: `web/.env.example`
- Create: `web/test/auth-config.test.ts`
- Modify: `web/package.json` (deps)

**Interfaces:**
- Consumes: Task 1 scaffold.
- Produces:
  - `web/lib/db.ts` exports `const dialect: LibsqlDialect`.
  - `web/lib/auth.ts` exports `const auth = betterAuth({...})` with `auth.options.emailAndPassword.enabled === true` and `disableSignUp === true` when `ALLOW_SIGNUP !== "true"`.

- [ ] **Step 1: Install dependencies**

```bash
cd web && npm install better-auth @libsql/client @libsql/kysely-libsql
```

- [ ] **Step 2: Create `web/lib/db.ts`**

```ts
import { LibsqlDialect } from "@libsql/kysely-libsql";

// Auth-only store. `file:` for local/dev, Turso `libsql://…` in prod.
export const dialect = new LibsqlDialect({
  url: process.env.DATABASE_URL ?? "file:local-auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
```

- [ ] **Step 3: Create `web/lib/auth.ts`**

```ts
import { betterAuth } from "better-auth";
import { dialect } from "@/lib/db";

// Public signup is OFF at runtime; the seed script sets ALLOW_SIGNUP=true.
const allowSignup = process.env.ALLOW_SIGNUP === "true";

export const auth = betterAuth({
  database: { dialect, type: "sqlite" },
  emailAndPassword: {
    enabled: true,
    disableSignUp: !allowSignup,
    minPasswordLength: 8,
  },
});
```

- [ ] **Step 4: Create `web/.env.example`**

```bash
# Auth store (LibSQL/Turso). Local default is a file db.
DATABASE_URL="file:local-auth.db"
DATABASE_AUTH_TOKEN=""

# Better Auth
BETTER_AUTH_SECRET="change-me-32-chars-min"
BETTER_AUTH_URL="http://localhost:3000"

# Single seeded user
APP_USERNAME="admin@vourdev.local"
APP_PASSWORD="change-me-strong"

# Set to true ONLY when running the seed script
ALLOW_SIGNUP="false"
```

- [ ] **Step 5: Write the failing test `web/test/auth-config.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { auth } from "@/lib/auth";

describe("auth config", () => {
  it("enables email/password auth", () => {
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });
  it("disables public signup by default", () => {
    expect(auth.options.emailAndPassword?.disableSignUp).toBe(true);
  });
});
```

- [ ] **Step 6: Run test, expect PASS**

Run: `cd web && npx vitest run test/auth-config.test.ts`
Expected: 2 passed. (Ensure `ALLOW_SIGNUP` is unset/false in the shell.)

- [ ] **Step 7: Commit**

```bash
cd .. && git add web && git commit -m "feat: add LibSQL client and Better Auth instance"
```

---

### Task 4: Migrations + single-user seed

**Files:**
- Create: `web/scripts/migrate.ts`
- Create: `web/scripts/seed-user.ts`
- Create: `web/test/auth-signin.test.ts`
- Create: `web/test/setup-db.ts`
- Modify: `web/package.json` (scripts + tsx dep + vitest globalSetup)
- Modify: `web/vitest.config.ts` (globalSetup)

**Interfaces:**
- Consumes: `auth` from Task 3.
- Produces:
  - `npm run db:migrate` creates the Better Auth schema in the configured db.
  - `npm run db:seed` creates exactly one user from `APP_USERNAME`/`APP_PASSWORD`, idempotent.
  - Verified: `auth.api.signInEmail` succeeds with seeded creds, fails with wrong creds.

- [ ] **Step 1: Install `tsx` for running TS scripts**

```bash
cd web && npm install -D tsx
```

- [ ] **Step 2: Create `web/scripts/migrate.ts`**

```ts
import { getMigrations } from "better-auth/db";
import { auth } from "@/lib/auth";

async function main() {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  console.log("✅ migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Create `web/scripts/seed-user.ts`**

```ts
import { auth } from "@/lib/auth";

async function main() {
  const email = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  if (!email || !password) throw new Error("APP_USERNAME and APP_PASSWORD required");

  try {
    await auth.api.signUpEmail({ body: { email, password, name: "Vour" } });
    console.log(`✅ seeded user ${email}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/exist/i.test(msg)) {
      console.log(`ℹ️  user ${email} already exists — skipping`);
      return;
    }
    throw err;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: Add scripts to `web/package.json`**

```json
"db:migrate": "tsx scripts/migrate.ts",
"db:seed": "ALLOW_SIGNUP=true tsx scripts/seed-user.ts"
```

- [ ] **Step 5: Create the Vitest DB setup `web/test/setup-db.ts`**

Runs migrations against a throwaway temp file db before the suite, deletes it after.

```ts
import { rmSync } from "node:fs";

const TEST_DB = "file:./.vitest-auth.db";

export async function setup() {
  process.env.DATABASE_URL = TEST_DB;
  process.env.ALLOW_SIGNUP = "true";
  process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret";
  const { getMigrations } = await import("better-auth/db");
  const { auth } = await import("@/lib/auth");
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
}

export async function teardown() {
  try { rmSync("./.vitest-auth.db"); } catch {}
}
```

- [ ] **Step 6: Wire globalSetup in `web/vitest.config.ts`**

Add to the `test` block:
```ts
globalSetup: ["./test/setup-db.ts"],
```

- [ ] **Step 7: Write the failing test `web/test/auth-signin.test.ts`**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { auth } from "@/lib/auth";

const email = "admin@vourdev.local";
const password = "test-password-123";

beforeAll(async () => {
  await auth.api.signUpEmail({ body: { email, password, name: "Vour" } });
});

describe("sign in", () => {
  it("succeeds with correct credentials", async () => {
    const res = await auth.api.signInEmail({ body: { email, password } });
    expect(res.user.email).toBe(email);
  });

  it("fails with wrong password", async () => {
    await expect(
      auth.api.signInEmail({ body: { email, password: "wrong-password" } })
    ).rejects.toBeTruthy();
  });
});
```

- [ ] **Step 8: Run test, expect PASS**

Run: `cd web && npx vitest run test/auth-signin.test.ts`
Expected: 2 passed.

- [ ] **Step 9: Commit**

```bash
cd .. && git add web && git commit -m "feat: add auth migrations and single-user seed"
```

---

### Task 5: Auth API route + client

**Files:**
- Create: `web/app/api/auth/[...all]/route.ts`
- Create: `web/lib/auth-client.ts`
- Create: `web/test/auth-route.test.ts`

**Interfaces:**
- Consumes: `auth` from Task 3.
- Produces:
  - `GET`/`POST` handlers at `/api/auth/*` via `toNextJsHandler(auth)`.
  - `web/lib/auth-client.ts` exports `authClient` with `signIn`, `signOut`, `useSession`.

- [ ] **Step 1: Create `web/app/api/auth/[...all]/route.ts`**

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 2: Create `web/lib/auth-client.ts`**

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signOut, useSession } = authClient;
```

- [ ] **Step 3: Write the failing test `web/test/auth-route.test.ts`**

Verifies the handler module exports both HTTP methods.

```ts
import { describe, it, expect } from "vitest";
import * as route from "@/app/api/auth/[...all]/route";

describe("auth route", () => {
  it("exports GET and POST handlers", () => {
    expect(typeof route.GET).toBe("function");
    expect(typeof route.POST).toBe("function");
  });
});
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run test/auth-route.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
cd .. && git add web && git commit -m "feat: add Better Auth API route and browser client"
```

---

### Task 6: Session guard helper + login page

**Files:**
- Create: `web/lib/session.ts`
- Create: `web/app/login/page.tsx`
- Create: `web/test/session.test.ts`

**Interfaces:**
- Consumes: `auth` (Task 3), `authClient` (Task 5).
- Produces:
  - `web/lib/session.ts` exports `async function requireSession()` that returns the session or calls `redirect("/login")`, and `async function getSession()` returning session-or-null.

- [ ] **Step 1: Create `web/lib/session.ts`**

```ts
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
```

- [ ] **Step 2: Create `web/app/login/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Write the failing test `web/test/session.test.ts`**

Verifies `getSession` returns null with no auth headers (the unauthenticated path `requireSession` guards on).

```ts
import { describe, it, expect } from "vitest";

describe("session helper", () => {
  it("returns null when no session cookie is present", async () => {
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({ headers: new Headers() });
    expect(session).toBeNull();
  });
});
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run test/session.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
cd .. && git add web && git commit -m "feat: add session guard helper and login page"
```

---

### Task 7: Protected home shell + middleware + deploy config

**Files:**
- Create: `web/middleware.ts`
- Create: `web/app/page.tsx` (replace generated)
- Create: `web/app/logout-button.tsx`
- Create: `web/README.md`
- Create: `web/test/middleware.test.ts`

**Interfaces:**
- Consumes: `requireSession` (Task 6), `signOut` (Task 5).
- Produces: `/` renders only when authenticated; unauthenticated hits redirect to `/login`. `web/middleware.ts` exports a `config.matcher` covering app routes but not `/login`, `/api/auth`, or static assets.

- [ ] **Step 1: Create `web/middleware.ts`**

Fast cookie-presence check at the edge (full validation happens in `requireSession` on the page).

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const cookie = getSessionCookie(request);
  if (!cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Create `web/app/logout-button.tsx`**

```tsx
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
```

- [ ] **Step 3: Replace `web/app/page.tsx`**

```tsx
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
```

- [ ] **Step 4: Write the failing test `web/test/middleware.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("middleware", () => {
  it("redirects unauthenticated requests to /login", () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });
});
```

- [ ] **Step 5: Run test, expect PASS**

Run: `cd web && npx vitest run test/middleware.test.ts`
Expected: 1 passed.

- [ ] **Step 6: Create `web/README.md`**

```markdown
# Vour Carousels (web)

Mobile-first single-user tool that turns a content idea into an on-brand
@vourdev photo carousel and pushes it to Buffer. Replaces the legacy
GitHub Actions + Playwright + n8n pipeline at repo root.

## Setup
1. `cp .env.example .env` and fill values (`BETTER_AUTH_SECRET`, `APP_USERNAME`, `APP_PASSWORD`, Turso `DATABASE_URL`/`DATABASE_AUTH_TOKEN` for prod).
2. `npm install`
3. `npm run db:migrate` — create the auth schema.
4. `npm run db:seed` — create the single user (runs with `ALLOW_SIGNUP=true`).
5. `npm run dev` — open http://localhost:3000 (redirects to /login).

## Deploy (Vercel)
- Set all `.env` vars in the Vercel project (use Turso for `DATABASE_URL`).
- Run `npm run db:migrate` and `npm run db:seed` against the Turso db once.
```

- [ ] **Step 7: Full suite green + build check**

Run:
```bash
cd web && npm test && npm run build
```
Expected: all tests pass; `next build` succeeds.

- [ ] **Step 8: Commit**

```bash
cd .. && git add web && git commit -m "feat: add protected home shell, auth middleware, and deploy docs"
```

---

## Self-Review

**Spec coverage (Plan 1 slice = spec §2 stack subset, §3B SaaS UI theme, §8 auth):**
- §8 Better Auth username+password, `disableSignUp`, single seeded user → Tasks 3, 4.
- §8 API route via `toNextJsHandler` → Task 5.
- §8 middleware guards all app pages → Tasks 6, 7.
- §8 minimal LibSQL/Turso store, auth-only → Tasks 3, 4 (temp-file test db; Turso in prod via env).
- §3B SaaS UI adopts editorial brand tokens (not generic globals) → Task 2.
- §2 stack (Next.js App Router + TS + Tailwind) → Task 1.
- Deferred to later plans (correctly out of Plan 1 scope): AI layer (§5, Plan 4), render (§4/§6, Plans 2–3), publish (§7, Plan 5).

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states expected output.

**Type consistency:** `auth` (lib/auth.ts) consumed by migrate/seed/route/session/middleware helper; `authClient`/`signIn`/`signOut` (lib/auth-client.ts) consumed by login page + logout button; `requireSession`/`getSession` (lib/session.ts) consumed by home page. `dialect` (lib/db.ts) consumed by lib/auth.ts. Names consistent across tasks.
