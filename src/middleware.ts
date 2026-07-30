// Protects the dashboard: unauthenticated users are bounced to /login.
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = ["/login", "/api/auth/login", "/forgot-password"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow static + public paths
  if (
    PUBLIC.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/logo") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("cmw_token")?.value;
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "change-me-in-production"
  );

  if (!token) return redirectToLogin(req);
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
