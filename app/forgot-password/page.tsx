'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const [step, setStep] = useState<'identify' | 'otp' | 'reset'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [userId, setUserId] = useState('');
  const [hint, setHint] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidMobile = (mobile: string) => /^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(mobile);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!isValidEmail(identifier) && !isValidMobile(identifier)) {
      setError('Enter a valid email address or Indian mobile number (10 digits).');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/otp/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', identifier }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`OTP sent to ${data.maskedEmail}`);
        setUserId(data.userId);
        setOtpSent(true);
        setStep('otp');
        setDebugOtp(data.otp || '');
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendCooldown(30);
    const intervalId = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    if (!isValidEmail(identifier) && !isValidMobile(identifier)) {
      setError('Enter a valid email address or Indian mobile number (10 digits).');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/otp/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', identifier }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`OTP resent to ${data.maskedEmail}`);
        setOtpSent(true);
        setDebugOtp(data.otp || '');
        startResendTimer();
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('Error resending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/otp/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', identifier, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetToken(data.resetToken);
        setUserId(data.userId);
        setHint(data.hint);
        setStep('reset');
        setMessage('OTP verified! Now set your new password.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Error verifying OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Error resetting password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" data-user-id={userId}>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-red-600">
          🔐 Forgot Password
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 text-red-700 rounded-lg font-semibold">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-400 text-green-700 rounded-lg font-semibold">
            {message}
          </div>
        )}
        {debugOtp && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-400 text-blue-700 rounded-lg font-semibold">
            Development OTP: <span className="font-mono">{debugOtp}</span>
          </div>
        )}

        {/* Step 1: Identify */}
        {step === 'identify' && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">
                Email or Mobile Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or mobile"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">
                Enter 6-Digit OTP
              </label>
              <p className="text-sm text-gray-600 mb-3">
                We&apos;ve sent an OTP to your registered email address
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 text-center text-2xl tracking-widest font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendCooldown > 0}
                className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('identify');
                  setOtp('');
                  setOtpSent(false);
                }}
                className="flex-1 bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 2.5: Initial OTP Button */}
        {step === 'identify' && otpSent === false && (
          <div className="text-center">
            {hint && (
              <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Password Hint:</p>
                <p className="text-lg font-semibold text-yellow-900">{hint}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3 bg-blue-50 p-3 rounded-lg">
                💡 Password Hint: <strong>{hint}</strong>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-sm text-gray-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}