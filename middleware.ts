import type { NextRequest } from "next/server";
import NextAuthMiddleware from "next-auth/middleware";

export function middleware(req: NextRequest) {
  return NextAuthMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!api/auth|api/settings/portal-theme|login|_next/static|_next/image|favicon.ico).*)",
  ],
};

