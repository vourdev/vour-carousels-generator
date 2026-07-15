import { describe, it, expect } from "vitest";
import * as route from "@/app/api/auth/[...all]/route";

describe("auth route", () => {
  it("exports GET and POST handlers", () => {
    expect(typeof route.GET).toBe("function");
    expect(typeof route.POST).toBe("function");
  });
});
