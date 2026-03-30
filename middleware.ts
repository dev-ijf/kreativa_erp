export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!api/auth|api/settings/portal-theme|login|_next/static|_next/image|favicon.ico).*)",
  ],
};

