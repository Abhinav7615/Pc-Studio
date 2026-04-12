import NextAuth, { type NextAuthOptions, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

let defaultAdminEnsured = false;
let adminEnsurePromise: Promise<void> | null = null;

async function ensureDefaultAdmin() {
  if (defaultAdminEnsured) return;
  await dbConnect();
  const existingAdmin = await User.findOne({ role: 'admin' });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('adminpassword', 12);
    const hashedAdminPassword = await bcrypt.hash('123456', 12);

    const admin = new User({
      name: 'Admin',
      email: 'yadavabhinav551@gmail.com',
      mobile: '6388391842',
      password: hashedPassword,
      passwordHint: 'Default hint',
      role: 'admin',
      adminEmail: 'admin@example.com',
      adminPassword: hashedAdminPassword,
    });

    await admin.save();
  } else {
    let updated = false;

    if (!existingAdmin.adminEmail) {
      existingAdmin.adminEmail = 'admin@example.com';
      updated = true;
    }
    if (!existingAdmin.adminPassword) {
      existingAdmin.adminPassword = await bcrypt.hash('123456', 12);
      updated = true;
    }
    if (!existingAdmin.email) {
      existingAdmin.email = 'yadavabhinav551@gmail.com';
      updated = true;
    }
    if (!existingAdmin.mobile) {
      existingAdmin.mobile = '6388391842';
      updated = true;
    }

    if (updated) {
      await existingAdmin.save();
    }
  }

  defaultAdminEnsured = true;
}

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

        if (!adminEnsurePromise) {
          adminEnsurePromise = ensureDefaultAdmin().catch((err) => {
            console.error('Admin ensure error:', err);
          });
        }

        await adminEnsurePromise;

        const rawIdentifier = credentials.identifier.trim();
        const mobileIdentifier = rawIdentifier.replace(/\D/g, '');
        const normalizedMobile = mobileIdentifier.length === 10
          ? mobileIdentifier
          : mobileIdentifier.length === 12 && mobileIdentifier.startsWith('91')
            ? mobileIdentifier.slice(-10)
            : '';
        const escapeRegExp = (str: string) => {
          return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const identifierRegex = new RegExp(`^${escapeRegExp(rawIdentifier)}$`, 'i');
        const mobileRegex = normalizedMobile
          ? new RegExp(`^(?:\\+?91)?${normalizedMobile}$`)
          : null;
        const isMobileIdentifier = normalizedMobile.length === 10;

          try {
            await dbConnect();

            const mobileQuery = isMobileIdentifier
              ? [{ mobile: normalizedMobile }, { mobile: mobileRegex! }]
              : [];

            const user = await User.findOne({
              $or: [
                { adminEmail: identifierRegex },
                { email: identifierRegex },
                ...mobileQuery,
              ],
            });

            if (!user) {
              throw new Error('No user found with that email or mobile');
            }

            if (user.blocked) {
              throw new Error('Your account has been blocked. Contact support.');
            }

            const isAdminOrStaff = user.role === 'admin' || user.role === 'staff';
            const hashedPassword = isAdminOrStaff ? user.adminPassword || user.password : user.password;

            if (!hashedPassword) {
              throw new Error('Password not set for this account');
            }

            const isValid = await bcrypt.compare(credentials.password as string, hashedPassword);
            if (!isValid) {
              throw new Error('Wrong password');
            }

            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              mobile: user.mobile,
              customerId: user.customerId || undefined,
              adminEmail: user.adminEmail || undefined,
            };
          } catch (error: unknown) {
            console.error('Auth error:', error);
            if (error instanceof Error) {
              throw new Error(error.message);
            }
            throw new Error('Authentication error');
          }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id?: string; role?: string; customerId?: string; adminEmail?: string } | null }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'customer';
        if (user.customerId) token.customerId = user.customerId;
        if (user.adminEmail) token.adminEmail = user.adminEmail;
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
        if (token.adminEmail) {
          (session.user as any).adminEmail = token.adminEmail as string;
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