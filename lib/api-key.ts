import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Does this request carry the automation key (n8n and other scripts)?
 *
 * The key is AUTOMATION_SECRET — the same one the backend checks on /automation/*. It used
 * to be BETTER_AUTH_SECRET, which made the session-signing secret double as an API key that
 * anyone holding it could use to act as any userId, and sent it over the wire to the
 * backend on every automation call. Unset means no key is accepted at all.
 *
 * Both sides are hashed first so the comparison is constant-time regardless of length.
 */
export function hasAutomationKey(req: Request): boolean {
  const expected = process.env.AUTOMATION_SECRET;
  const given = req.headers.get("x-api-key");
  if (!expected || !given) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
