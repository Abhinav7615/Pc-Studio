import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface User extends DefaultUser {
    role: string;
    customerId?: string;
  }

  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
      role: string;
      customerId?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    customerId?: string;
  }
}