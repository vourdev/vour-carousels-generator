import { describe, it, expect, beforeAll } from "vitest";

const email = "admin@vourdev.local";
const password = "test-password-123";

// `auth` is imported dynamically (not statically) so that `ALLOW_SIGNUP=true`
// is in effect *before* lib/auth.ts evaluates `disableSignUp` at module-load
// time. A static top-level import would be hoisted and evaluated during
// Vitest's collection phase — before this env var is set — and would also
// leak ALLOW_SIGNUP=true globally, breaking auth-config.test.ts's "disables
// public signup by default" assertion. See test/setup-db.ts for more.
let auth: typeof import("@/lib/auth")["auth"];

beforeAll(async () => {
  process.env.ALLOW_SIGNUP = "true";
  ({ auth } = await import("@/lib/auth"));
  delete process.env.ALLOW_SIGNUP;

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
