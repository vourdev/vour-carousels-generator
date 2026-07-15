import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const cookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (cookie) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};

