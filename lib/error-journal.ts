/**
 * The last few backend failures, kept in memory so they can be read back from the UI.
 *
 * Next.js redacts the message of any error thrown inside a Server Action in a production
 * build: the browser receives a generic sentence and a digest, and the text that says
 * what actually went wrong stays in the server log. Every AI call in this app is a Server
 * Action, so in practice a failed generation was unexplainable without SSH access — the
 * operator saw "an error occurred" and nothing else.
 *
 * Route Handlers are not redacted. So the message is recorded here on the way past and
 * served from `/api/diag/errors`, which is a Route Handler, and the panel in the layout
 * reads it. Nothing at the 42 call sites had to change: they all reach the backend
 * through lib/backend.ts, and that is where the recording happens.
 *
 * Module state is per server process, which is exactly why this works now and would not
 * have before. Self-hosted, this is one long-lived Node process. On Vercel each
 * invocation could be a fresh instance, and a journal written during the failed request
 * would usually be gone by the time the client asked for it.
 */

export interface JournalEntry {
  id: string;
  at: number;
  /** Method and path of the backend call, e.g. "POST /api/plan". */
  where: string;
  status?: number;
  message: string;
}

/** Enough to cover a debugging session, small enough to never be worth thinking about. */
const MAX_ENTRIES = 50;

const entries: JournalEntry[] = [];
let seq = 0;

export function recordFailure(input: { where: string; status?: number; message: string }): void {
  entries.unshift({
    id: `${Date.now().toString(36)}-${(seq++).toString(36)}`,
    at: Date.now(),
    ...input,
  });
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
}

/** Newest first. */
export function recentFailures(limit = 20): JournalEntry[] {
  return entries.slice(0, Math.max(0, limit));
}

export function clearFailures(): void {
  entries.length = 0;
}
