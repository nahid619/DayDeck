// middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Protect /admin/dashboard — redirect to login if no session
  if (pathname.startsWith("/admin/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/admin", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Already logged in and visiting login page → go to dashboard
  if (pathname === "/admin" && token) {
    const dashUrl = new URL("/admin/dashboard", request.url);
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/dashboard/:path*"],
};
