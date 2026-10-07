import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /app and student diagnostic dashboard behind authentication
  if (pathname.startsWith("/app")) {
    const sessionCookie = request.cookies.get("shikshagap_session");
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/api/students/:path*"],
};
