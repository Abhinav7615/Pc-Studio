import NextAuth, { type NextAuthOptions, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyFirebaseIdToken } from '@/lib/firebaseAdmin';
import { getMobileOtp, deleteMobileOtp } from '@/lib/otpStore';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      customerId?: string;
      adminEmail?: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    customerId?: string;
    adminEmail?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    customerId?: string;
    adminEmail?: string;
  }
}

const defaultAdminEnsured = false;
let adminEnsurePromise: Promise<void> | null = null;

async function ensureDefaultAdmin() {
  // Always run this to ensure password is current
  if (adminEnsurePromise) {
    await adminEnsurePromise;
    return;
  }
  
  // Create promise to prevent concurrent runs
  adminEnsurePromise = (async () => {
    await dbConnect();
  const existingAdmin = await User.findOne({ role: 'admin' });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('adminpassword', 12);
    const hashedAdminPassword = await bcrypt.hash('Abhinav@7614', 12);

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
    // Always update adminPassword to the current one
    existingAdmin.adminPassword = await bcrypt.hash('Abhinav@7614', 12);
    updated = true;
    
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
  })();
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Mobile', type: 'text' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP', type: 'text' },
        firebaseIdToken: { label: 'Firebase ID Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier) {
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
        const isOtpLogin = Boolean(credentials.otp?.trim());
        const firebaseIdToken = credentials.firebaseIdToken as string | undefined;

        try {
          await dbConnect();

          let user = null;
          let tokenPhone = '';

          if (firebaseIdToken) {
            try {
              const decodedToken = await verifyFirebaseIdToken(firebaseIdToken);
              tokenPhone = typeof decodedToken.phone_number === 'string' ? decodedToken.phone_number.replace(/^\+/, '') : '';
              const normalizedTokenPhone = tokenPhone.startsWith('91') ? tokenPhone.slice(2) : tokenPhone;
              if (!normalizedTokenPhone || normalizedTokenPhone.length !== 10) {
                throw new Error('Firebase token does not contain a valid phone number');
              }

              if (isMobileIdentifier && normalizedTokenPhone !== normalizedMobile) {
                throw new Error('Firebase phone number does not match entered mobile number');
              }

              const mobileQuery = [{ mobile: normalizedTokenPhone }, { mobile: new RegExp(`^(?:\\+?91)?${normalizedTokenPhone}$`) }];
              user = await User.findOne({
                $or: mobileQuery,
              });
              if (!user) {
                console.warn(`Firebase verified mobile ${normalizedTokenPhone} not found, creating temporary session for dev`);
              }
            } catch (firebaseError) {
              console.error('Firebase token verification failed:', firebaseError);
              throw new Error('Firebase verification failed. Please request OTP again.');
            }
          } else if (isOtpLogin) {
            if (!isMobileIdentifier) {
              throw new Error('OTP login requires a valid mobile number');
            }
            // For dev mode, allow OTP without user in database
            try {
              const mobileQuery = [{ mobile: normalizedMobile }, { mobile: mobileRegex! }];
              user = await User.findOne({
                $or: mobileQuery,
              });
              if (!user) {
                console.warn(`Mobile ${normalizedMobile} not found, but allowing OTP verification for dev testing`);
              }
            } catch (dbError) {
              console.warn('User lookup failed during OTP auth, continuing for dev:', dbError);
            }
          } else {
            // For password login, user must exist
            const mobileQuery = isMobileIdentifier
              ? [{ mobile: normalizedMobile }, { mobile: mobileRegex! }]
              : [];

            user = await User.findOne({
              $or: [
                { adminEmail: identifierRegex },
                { email: identifierRegex },
                ...mobileQuery,
              ],
            });

            if (!user) {
              return null; // Invalid credentials
            }

            if (user.blocked) {
              return null; // Invalid credentials
            }
          }
          const enteredPassword = credentials.password as string || '';

          if (firebaseIdToken) {
            if (user) {
              return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                mobile: user.mobile,
                customerId: user.customerId || undefined,
                adminEmail: user.adminEmail || undefined,
              };
            }
            return {
              id: `temp_${normalizedMobile || tokenPhone}`,
              name: 'OTP User',
              email: undefined,
              role: 'customer',
              mobile: normalizedMobile || tokenPhone,
              customerId: undefined,
              adminEmail: undefined,
            };
          }

          if (isOtpLogin) {
            if (!isMobileIdentifier) {
              throw new Error('OTP login requires a valid mobile number');
            }

            const mobileKey = `mobile_${normalizedMobile}`;
            const storedOtp = getMobileOtp(mobileKey);
            if (!storedOtp) {
              throw new Error('OTP expired or invalid. Please request a new OTP.');
            }

            if (new Date() > storedOtp.expiresAt) {
              deleteMobileOtp(mobileKey);
              throw new Error('OTP has expired. Please request a new OTP.');
            }

            if (storedOtp.attempts >= 3) {
              deleteMobileOtp(mobileKey);
              throw new Error('Too many failed attempts. Please request a new OTP.');
            }

            if (storedOtp.otp !== credentials.otp?.trim()) {
              storedOtp.attempts++;
              throw new Error('Invalid OTP. Please try again.');
            }

            deleteMobileOtp(mobileKey);

            if (user) {
              return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                mobile: user.mobile,
                customerId: user.customerId || undefined,
                adminEmail: user.adminEmail || undefined,
              };
            }

            console.warn(`OTP verified but user not in database. Creating temporary session for mobile: ${normalizedMobile}`);
            return {
              id: `temp_${normalizedMobile}`,
              name: 'OTP User',
              email: undefined,
              role: 'customer',
              mobile: normalizedMobile,
              customerId: undefined,
              adminEmail: undefined,
            };
          }

          const isAdminOrStaff = user.role === 'admin' || user.role === 'staff';

          if (isAdminOrStaff && user.adminPassword) {
            const isAdminPasswordValid = await bcrypt.compare(enteredPassword, user.adminPassword);
            if (isAdminPasswordValid) {
              return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                mobile: user.mobile,
                customerId: user.customerId || undefined,
                adminEmail: user.adminEmail || undefined,
              };
            }
          }

          if (!user.password) {
            throw new Error('Password not set for this account');
          }

          const isPasswordValid = await bcrypt.compare(enteredPassword, user.password);
          if (!isPasswordValid) {
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
        if (user.id) token.id = user.id;
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