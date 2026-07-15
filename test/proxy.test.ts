import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("proxy", () => {
  it("redirects unauthenticated requests to /login", () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows unauthenticated requests to /login", () => {
    const req = new NextRequest("http://localhost:3000/login");
    const res = proxy(req);
    // NextResponse.next() typically sets a header or returns 200/204
    expect(res.status).toBe(200);
  });

  it("redirects authenticated requests to /login back to /", () => {
    const req = new NextRequest("http://localhost:3000/login", {
      headers: {
        cookie: "better-auth.session_token=mock-token",
      },
    });
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("allows authenticated requests to /", () => {
    const req = new NextRequest("http://localhost:3000/", {
      headers: {
        cookie: "better-auth.session_token=mock-token",
      },
    });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});

