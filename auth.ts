import NextAuth, { type NextAuthOptions, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Mobile', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const rawIdentifier = credentials.identifier.trim();

        const escapeRegExp = (str: string) => {
          return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const identifierRegex = new RegExp(`^${escapeRegExp(rawIdentifier)}$`, 'i');

        try {
          await dbConnect();

          // First check if this is an admin or staff by their adminEmail or email (case-insensitive)
          const adminUser = await User.findOne({
            $or: [
              { adminEmail: identifierRegex },
              { email: identifierRegex },
            ],
          });

          if (adminUser) {
            // This is an admin login attempt
            if (adminUser.blocked) {
              return null;
            }

            // Verify against admin password
            if (!adminUser.adminPassword) {
              return null;
            }

            const isValid = await bcrypt.compare(credentials.password as string, adminUser.adminPassword);

            if (!isValid) {
              return null;
            }

            return {
              id: adminUser._id.toString(),
              name: adminUser.name,
              email: adminUser.email,
              role: adminUser.role,
              mobile: adminUser.mobile,
              customerId: adminUser.customerId || undefined,
            };
          }

          // Otherwise, try regular customer/staff login by email or mobile
          const user = await User.findOne({
            $or: [
              { email: identifierRegex },
              { mobile: rawIdentifier },
            ],
          });

          if (!user) {
            return null;
          }

          if (user.blocked) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            mobile: user.mobile,
            customerId: user.customerId || undefined,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id?: string; role?: string; customerId?: string } | null }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'customer';
        if (user.customerId) token.customerId = user.customerId;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? 'customer';
        if (token.customerId) {
          session.user.customerId = token.customerId as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);