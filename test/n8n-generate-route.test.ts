import { describe, it, expect } from "vitest";
import * as route from "@/app/api/n8n-generate/route";

describe("n8n generate route", () => {
  it("exports POST handler", () => {
    expect(typeof route.POST).toBe("function");
  });
  
  it("returns 401 on unauthorized access", async () => {
    const req = new Request("http://localhost/api/n8n-generate", {
      method: "POST",
      headers: {
        "x-api-key": "invalid-key",
      },
      body: JSON.stringify({ topic: "Test Topic" }),
    });
    
    const res = await route.POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 on missing topic", async () => {
    const originalSecret = process.env.BETTER_AUTH_SECRET;
    process.env.BETTER_AUTH_SECRET = "test-secret";
    try {
      const req = new Request("http://localhost/api/n8n-generate", {
        method: "POST",
        headers: {
          "x-api-key": "test-secret",
        },
        body: JSON.stringify({}),
      });
      
      const res = await route.POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Missing topic or title in request body");
    } finally {
      process.env.BETTER_AUTH_SECRET = originalSecret;
    }
  });
});
