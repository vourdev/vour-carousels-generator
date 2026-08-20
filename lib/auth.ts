import { betterAuth } from "better-auth";
import { dialect } from "@/lib/db";

// Public signup is OFF at runtime; the seed script sets ALLOW_SIGNUP=true.
const allowSignup = process.env.ALLOW_SIGNUP === "true";

export const auth = betterAuth({
  database: { dialect, type: "sqlite" },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
  ],
  // Under Vitest, quiet better-auth to error-level so expected warn logs
  // (missing base URL, deliberate invalid-password test paths) don't pollute
  // test output. Runtime keeps the default warn level.
  ...(process.env.VITEST ? { logger: { level: "error" as const } } : {}),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !allowSignup,
    minPasswordLength: 8,
  },
});
