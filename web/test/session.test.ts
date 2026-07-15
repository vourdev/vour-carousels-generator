import { describe, it, expect } from "vitest";

describe("session helper", () => {
  it("returns null when no session cookie is present", async () => {
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({ headers: new Headers() });
    expect(session).toBeNull();
  });
});
