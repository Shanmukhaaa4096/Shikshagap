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

  // Apply noindex and no-store caching headers to shared report URLs
  if (pathname.startsWith("/report/") || pathname.startsWith("/r/")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }

  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/api/students/:path*", "/report/:path*", "/r/:path*"],
};
