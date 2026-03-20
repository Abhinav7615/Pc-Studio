import NextAuth, { type NextAuthOptions } from 'next-auth';
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

        try {
          await dbConnect();

          // First check if this is an admin email
          const adminUser = await User.findOne({
            adminEmail: credentials.identifier,
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
            };
          }

          // Otherwise, try regular customer login
          const user = await User.findOne({
            $or: [
              { email: credentials.identifier },
              { mobile: credentials.identifier },
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
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
        const userDoc = await User.findById(user.id);
        if (userDoc) {
          token.role = userDoc.role;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
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