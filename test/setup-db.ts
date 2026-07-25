import { rmSync } from "node:fs";

const TEST_DB = "file:./.vitest-auth.db";

export async function setup() {
  process.env.DATABASE_URL = TEST_DB;
  process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret";
  // Set before importing @/lib/auth below so better-auth doesn't warn about a
  // missing base URL during global setup. Test-only; runtime is unaffected.
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  // Deliberately NOT setting ALLOW_SIGNUP here: it's read once, at module-load
  // time, by lib/auth.ts to gate `disableSignUp`. Setting it globally would
  // leak into every test file's `auth` singleton (including
  // auth-config.test.ts's "disables public signup by default" assertion from
  // Task 3), since Vitest resolves all static top-level imports across test
  // files before running any test body. Migrations don't need it either —
  // schema generation never reads `disableSignUp`. Tests that need signup
  // enabled (auth-signin.test.ts) set ALLOW_SIGNUP themselves, scoped to a
  // dynamic import inside their own beforeAll.
  const { getMigrations } = await import("better-auth/db/migration");
  const { auth } = await import("@/lib/auth");
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
}

export async function teardown() {
  try { rmSync("./.vitest-auth.db"); } catch {}
}
