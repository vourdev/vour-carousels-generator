import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Cookie-presence gate only. It can say "certainly signed out" (no cookie), never
 * "signed in": a cookie can outlive its session — a rotated BETTER_AUTH_SECRET, a revoked
 * or deleted session row, a swapped database. So it must not bounce /login back to /.
 * Doing that looped forever: / rejected the dead session and sent the browser to /login,
 * and this sent it straight back. /login checks the real session itself.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request) && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
