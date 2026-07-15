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
