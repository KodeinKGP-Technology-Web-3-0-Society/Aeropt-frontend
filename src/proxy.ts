import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/home",
  "/plan",
  "/readiness",
  "/lesson",
  "/doubt",
  "/assess",
  "/dashboard",
  "/roadmap",
  "/chat",
  "/settings",
  "/progress",
  "/practice",
  "/onboarding",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasAuth = request.cookies.get("has_auth")?.value === "1";
  if (!hasAuth) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home",
    "/home/:path*",
    "/plan",
    "/plan/:path*",
    "/readiness",
    "/readiness/:path*",
    "/lesson",
    "/lesson/:path*",
    "/doubt",
    "/doubt/:path*",
    "/assess",
    "/assess/:path*",
    "/dashboard/:path*",
    "/roadmap/:path*",
    "/chat/:path*",
    "/settings/:path*",
    "/progress/:path*",
    "/practice/:path*",
    "/onboarding/:path*",
  ],
};
