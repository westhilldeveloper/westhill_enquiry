import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          throw new Error('No user found');
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }
        return { id: user.id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
    // ✅ Add this redirect callback to fix production redirects
    async redirect({ url, baseUrl }) {
      // If the URL is relative, resolve it against the base URL
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // If the URL is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) return url;
      // Default fallback: go to the dashboard
      return baseUrl;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.JWT_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };