import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || '';
        token.email = user.email || '';
        token.name = user.name || '';
        token.role = user.role || 'customer';
        token.image = user.image || '';
        token.emailVerified = !!user.emailVerified;
        (token as any).phone = (user as any).phone || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as any;
        session.user.image = token.image as string;
        (session.user as any).emailVerified = !!token.emailVerified;
        (session.user as any).phonenumber = (token as any).phone as string;
      }
      return session;
    },
  },
  providers: [], // Empty array for Edge compatibility
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
