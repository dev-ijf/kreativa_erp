import NextAuth from "next-auth/middleware";

const authMiddleware = NextAuth({
  pages: {
    signIn: "/login",
  },
});

export default authMiddleware;

export const config = {
  matcher: [
    "/((?!api/auth|api/settings/portal-theme|login|_next/static|_next/image|favicon.ico).*)",
  ],
};

