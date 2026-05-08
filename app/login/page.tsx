'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { auth, getRecaptchaVerifier } from '@/lib/firebaseClient';
// import { signInWithPhoneNumber } from 'firebase/auth';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // const [useOtpLogin, setUseOtpLogin] = useState(false);
  // const [otpSent, setOtpSent] = useState(false);
  // const [otpCode, setOtpCode] = useState('');
  // const [otpError, setOtpError] = useState('');
  // const [otpMessage, setOtpMessage] = useState('');
  // const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  // const isDev = process.env.NODE_ENV !== 'production';
  // const useFirebasePhoneAuth = Boolean(
  //   process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  //   process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  //   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  //   process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  // );
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [_checkingAdmin, setCheckingAdmin] = useState(false);
  const router = useRouter();

  // Check if entered identifier is an admin or staff email
  useEffect(() => {
    const checkAdminStaffEmail = async () => {
      if (!identifier.trim()) {
        setIsAdminMode(false);
        setIsStaffMode(false);
        return;
      }

      setCheckingAdmin(true);
      try {
        const res = await fetch('/api/auth/check-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier }),
        });

        const data = await res.json();
        setIsAdminMode(data.isAdmin);
        setIsStaffMode(data.isStaff);
      } catch (error) {
        console.error('Admin/staff check failed:', error);
        setIsAdminMode(false);
        setIsStaffMode(false);
      }
      setCheckingAdmin(false);
    };

    const timer = setTimeout(checkAdminStaffEmail, 300);
    return () => clearTimeout(timer);
  }, [identifier]);

  // OTP functions temporarily disabled
  /*
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpMessage('');

    const normalizedIdentifier = identifier.trim();
    const mobileDigits = normalizedIdentifier.replace(/\D/g, '');

    if (mobileDigits.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      if (!isDev) {
        const verifier = getRecaptchaVerifier('recaptcha-container');
        const phoneNumber = `+91${mobileDigits}`;
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        setConfirmationResult(confirmation);
        setOtpMessage('OTP sent by Firebase. Enter the code below.');
        setOtpSent(true);
      } else {
        // Development fallback: use local OTP route instead of Firebase billing-based phone auth
        const res = await fetch('/api/otp/mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send', mobile: mobileDigits }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.debugOtp) {
            setOtpMessage(`OTP for development: ${data.debugOtp}`);
          } else if (data.debugSms) {
            setOtpMessage(data.message || 'OTP sent to your mobile');
          } else {
            setOtpMessage(data.message || 'OTP sent to your mobile');
          }
          setOtpSent(true);
          setConfirmationResult(null);
        } else {
          throw new Error(data.error || 'Failed to send OTP');
        }
      }
    } catch (err: unknown) {
      console.error('OTP send failed:', err);
      if (!isDev && err instanceof Error && err.message.includes('auth/billing-not-enabled')) {
        setOtpError('Firebase billing is not enabled for phone auth. OTP send is using development fallback.');
      } else {
        setOtpError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
      }

      if (isDev) {
        setOtpMessage('Development fallback enabled. OTP will be logged to the console.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const normalizedIdentifier = identifier.trim();
      const mobileDigits = normalizedIdentifier.replace(/\D/g, '');

      if (confirmationResult) {
        const credential = await confirmationResult.confirm(otpCode.trim());
        const idToken = await credential.user.getIdToken();

        const result = await signIn('credentials', {
          identifier: mobileDigits,
          firebaseIdToken: idToken,
          redirect: false,
        });

        if (result?.error) {
          setOtpError(result.error || 'OTP verification failed');
          setLoading(false);
          return;
        }

        if (result?.ok) {
          router.push('/');
          return;
        }
      }

      const result = await signIn('credentials', {
        identifier: mobileDigits,
        otp: otpCode.trim(),
        redirect: false,
      });

      if (result?.error) {
        setOtpError(result.error || 'Invalid OTP');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setOtpError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAdminError('');

    const normalizedIdentifier = identifier.trim();
    const mobileDigits = normalizedIdentifier.replace(/\D/g, '');
    const identifierToSend = mobileDigits.length === 10
      ? mobileDigits
      : mobileDigits.length === 12 && mobileDigits.startsWith('91')
        ? mobileDigits.slice(-10)
        : normalizedIdentifier;

    const result = await signIn('credentials', {
      identifier: identifierToSend,
      password,
      redirect: false,
    });

    if (result?.error) {
      const errorMessage = result.error || 'Invalid credentials';
      if (isAdminMode) {
        setAdminError(errorMessage);
      } else {
        setError(errorMessage);
      }
      setLoading(false);
      return;
    }

    if (result?.ok) {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (isAdminMode || isStaffMode) {
        if (session?.user?.role === 'admin' || session?.user?.role === 'staff') {
          router.push('/admin');
        } else {
          setAdminError('You do not have admin/staff access');
          setLoading(false);
        }
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Login
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {adminError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {adminError}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-900 font-bold mb-1">Email or Mobile</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={`w-full px-3 py-2 border rounded focus:outline-none text-gray-900 placeholder-gray-400
                ${isAdminMode ? 'border-red-400 focus:border-red-600' : isStaffMode ? 'border-orange-400 focus:border-orange-600' : 'border-gray-300 focus:border-blue-600'}
              `}
              required
              placeholder="Enter email or mobile"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-900 font-bold mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 placeholder-gray-400
                  ${isAdminMode ? 'border-red-400 focus:border-red-600' : isStaffMode ? 'border-orange-400 focus:border-orange-600' : 'border-gray-300 focus:border-blue-600'}
                `}
                required
                placeholder={isAdminMode ? 'Enter admin password' : isStaffMode ? 'Enter staff password' : 'Enter password'}
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-700 px-2 py-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-2 rounded transition disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {!isAdminMode && !isStaffMode && (
          <>
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800 text-sm">
                Forgot Password?
              </Link>
            </div>
            <hr className="my-4" />
            <div className="mt-4 text-center">
              <p className="text-gray-700 text-sm mb-2 font-medium">Don&apos;t have an account?</p>
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-bold">
                Register here
              </Link>
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}