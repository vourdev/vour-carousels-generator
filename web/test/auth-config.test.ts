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
