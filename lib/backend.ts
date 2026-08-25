import { headers } from "next/headers";
import { recordFailure } from "./error-journal";

/**
 * The single door from this app to the Hono backend.
 *
 * Everything that is not "read a row and render it" lives behind this call:
 * model selection, brief and plan generation, revision, capture, and publishing.
 * The app used to hold its own copy of that logic, which drifted from the
 * backend's — same prompts, different constraints, and a publish path that
 * silently dropped hashtags. There is one implementation now, and it is not here.
 */
/**
 * Ceiling on one backend call.
 *
 * There did not used to be one, and there did not need to be: the call went out through
 * Cloudflare, which cut it off at ~100 seconds whether we liked it or not. Since this app
 * moved onto the same box as the backend it talks over the internal network instead, and
 * that ceiling is gone — which is the point, because generation legitimately takes
 * minutes. Nothing else would ever end a hung request, so the limit has to be ours now.
 */
const BACKEND_TIMEOUT_MS = Number(process.env.BACKEND_TIMEOUT_MS ?? 600_000);

/** As much of a failed response as is useful to read, without pasting a whole HTML page. */
function describeBody(body: string): string {
  if (!body) return "";
  try {
    const j = JSON.parse(body);
    const detail = j.error ?? j.message ?? j.detail;
    if (typeof detail === "string" && detail) return detail;
  } catch {
    // Not JSON — an nginx error page, a proxy notice, a stack trace. Those are exactly
    // the cases the old code threw away, and they are the ones that say what broke.
  }
  const flat = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return flat.length > 300 ? `${flat.slice(0, 300)}…` : flat;
}

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
  const method = init.method ?? "GET";
  const started = Date.now();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: forwardHeaders,
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch (err) {
    // A throw here is the connection, not the backend: DNS, a refused port, or our own
    // deadline. The old code let this surface as a bare "fetch failed", which named
    // neither the call that failed nor the address it tried — so a wrong BACKEND_API_URL
    // and a backend that was genuinely down produced the same unhelpful sentence.
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    const reason =
      err instanceof Error && err.name === "TimeoutError"
        ? `tidak menjawab dalam ${secs}s (batas ${BACKEND_TIMEOUT_MS / 1000}s)`
        : `tidak bisa dihubungi setelah ${secs}s (${err instanceof Error ? err.message : String(err)})`;
    const message = `Backend ${reason} — ${method} ${baseUrl}${path}`;
    recordFailure({ where: `${method} ${path}`, message });
    throw new Error(message);
  }

  if (!res.ok) {
    // Read as text, not JSON. A 502 from nginx and a 524 from Cloudflare are HTML, and
    // `res.json()` on those threw, got swallowed by the catch, and left only the status
    // code. "Backend returned error 524" was the whole message users ever saw.
    const detail = describeBody(await res.text().catch(() => ""));
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    const message =
      `Backend ${res.status} ${res.statusText} setelah ${secs}s — ${method} ${path}` +
      (detail ? `: ${detail}` : "");
    // Recorded before it is thrown, because a Server Action strips this text on the way
    // to the browser and /api/diag/errors is the only path that can hand it back intact.
    recordFailure({ where: `${method} ${path}`, status: res.status, message });
    throw new Error(message);
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
