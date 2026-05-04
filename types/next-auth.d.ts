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

// MSG91 OTP Widget Type Declarations
declare global {
  interface Window {
    initSendOTP?: (config: {
      widgetId: string;
      tokenAuth: string;
      identifier?: string;
      exposeMethods?: string | boolean;
      success?: (data: any) => void;
      failure?: (error: any) => void;
    }) => void;
    retryOtp?: (...args: any[]) => void;
    sendOtp?: (...args: any[]) => void;
    verifyOtp?: (...args: any[]) => void;
  }
}