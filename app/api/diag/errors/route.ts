import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { clearFailures, recentFailures } from "@/lib/error-journal";

/**
 * Read back what the server saw. A Route Handler on purpose: this is the one place whose
 * response body Next.js does not redact in production, which is the whole reason the
 * journal exists — see lib/error-journal.ts.
 *
 * Session-guarded even though it holds no secrets. The messages quote backend responses,
 * and those can carry internal hostnames and upstream provider text that has no reason to
 * be readable by anyone who is not already signed in.
 */
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ entries: recentFailures() });
}

export async function DELETE() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  clearFailures();
  return NextResponse.json({ ok: true });
}
