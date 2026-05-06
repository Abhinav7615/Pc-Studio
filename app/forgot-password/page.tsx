'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'identify' | 'otp' | 'reset'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isValidEmail(identifier)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/otp/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', identifier, method: 'email' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'OTP sent to your email address.');
        setStep('otp');
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('Error sending email OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (otp: string) => {
    setError('');
    setMessage('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/otp/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', identifier, otp: otp.trim(), method: 'email' }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetToken(data.resetToken || '');
        setStep('reset');
        setMessage('Email OTP verified. Enter your new password.');
      } else {
        setError(data.error || 'Invalid OTP.');
      }
    } catch (err) {
      console.error('Error verifying email OTP:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!resetToken) {
      setError('Please verify the email OTP first.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, resetToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div id="recaptcha-container" className="hidden" />
        <h2 className="text-3xl font-bold mb-6 text-center text-red-600">Forgot Password</h2>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-400 text-red-700 rounded text-sm">{error}</div>}
        {message && <div className="mb-4 p-4 bg-green-50 border border-green-400 text-green-700 rounded text-sm">{message}</div>}

        {step === 'identify' && (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold text-sm mb-2">Email Address</label>
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <EmailOtpStep
            onVerify={handleVerifyEmailOtp}
            onBack={() => {
              setStep('identify');
              setMessage('');
              setError('');
            }}
            loading={loading}
          />
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold text-sm">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                  placeholder="New password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold text-sm">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                placeholder="Confirm new password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Resetting password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

function EmailOtpStep({
  onVerify,
  onBack,
  loading,
}: {
  onVerify: (otp: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}) {
  const [emailOtp, setEmailOtp] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onVerify(emailOtp);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <label className="block text-gray-900 font-semibold text-sm">Enter 6-digit OTP</label>
        <input
          type="text"
          value={emailOtp}
          onChange={(e) => setEmailOtp(e.target.value.slice(0, 6))}
          placeholder="Enter OTP"
          maxLength={6}
          className="w-full px-4 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded hover:bg-gray-300 text-sm"
      >
        Back
      </button>
    </form>
  );
}
