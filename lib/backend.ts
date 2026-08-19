import { headers } from "next/headers";

/**
 * The single door from this app to the Hono backend.
 *
 * Everything that is not "read a row and render it" lives behind this call:
 * model selection, brief and plan generation, revision, capture, and publishing.
 * The app used to hold its own copy of that logic, which drifted from the
 * backend's — same prompts, different constraints, and a publish path that
 * silently dropped hashtags. There is one implementation now, and it is not here.
 */
async function backendFetch(path: string, init: RequestInit = {}): Promise<any> {
  const reqHeaders = await headers();
  const forwardHeaders = new Headers(init.headers);
  forwardHeaders.set("Content-Type", "application/json");

  // The backend authenticates the end user, not this app, so the caller's
  // credentials are forwarded rather than exchanged for a service token.
  const cookie = reqHeaders.get("cookie");
  if (cookie) forwardHeaders.set("cookie", cookie);
  const auth = reqHeaders.get("authorization");
  if (auth) forwardHeaders.set("authorization", auth);

  const baseUrl = process.env.BACKEND_API_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers: forwardHeaders });

  if (!res.ok) {
    const errObj = await res.json().catch(() => ({}));
    throw new Error(errObj.error || `Backend returned error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export function backendGet(path: string): Promise<any> {
  return backendFetch(path, { method: "GET" });
}

export function backendSend(
  path: string,
  body?: unknown,
  method: "POST" | "PATCH" | "DELETE" = "POST"
): Promise<any> {
  return backendFetch(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
