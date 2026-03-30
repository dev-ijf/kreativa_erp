import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import sql from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      fullName: string;
      email: string;
      role: string;
      schoolId: number | null;
    };
  }

  interface User {
    id: number;
    fullName: string;
    email: string;
    role: string;
    schoolId: number | null;
  }
}

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      const rows = await sql<{
        id: number;
        full_name: string;
        email: string;
        role: string;
        school_id: number | null;
      }>`
        SELECT id, full_name, email, role, school_id
        FROM core_users
        WHERE email = ${email}
      `;

      const dbUser = rows[0];
      if (!dbUser) {
        // Tolak login jika email tidak terdaftar di core_users
        return false;
      }

      (user as any).id = dbUser.id;
      (user as any).fullName = dbUser.full_name;
      (user as any).role = dbUser.role;
      (user as any).schoolId = dbUser.school_id;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.fullName = (user as any).fullName ?? user.name;
        token.email = user.email;
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: (token.id ?? 0) as number,
        fullName: (token.fullName as string) || (token.name as string) || "",
        email: (token.email as string) || "",
        role: (token.role as string) || "",
        schoolId: (token.schoolId as number | null) ?? null,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { handler as GET, handler as POST };

