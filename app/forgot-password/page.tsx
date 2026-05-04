'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function ForgotPassword() {
  const [step, setStep] = useState<'identify' | 'otp' | 'reset'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [userId, setUserId] = useState('');
  const [hint, setHint] = useState('');
  const [method, setMethod] = useState<'email' | 'mobile'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpWidget, setShowOtpWidget] = useState(false);
  const [identifierForWidget, setIdentifierForWidget] = useState('');
  const [otpWidgetLoaded, setOtpWidgetLoaded] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const widgetToken = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || '';
  const router = useRouter();

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidMobile = (mobile: string) => /^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(mobile);

  const getOtpWidgetConfiguration = (identifier: string) => ({
    widgetId: '366441705372363439393933',
    tokenAuth: widgetToken,
    identifier,
    exposeMethods: 'true',
    success: async (data: any) => {
      console.log('OTP verified successfully', data);
      const token = data.token || data.tokenAuth || '';
      setResetToken(token);
      setShowOtpWidget(false);
      setStep('reset');
      setMessage('OTP verified! Now set your new password.');
      setTimeout(() => setMessage(''), 3000);
    },
    failure: (error: any) => {
      console.log('OTP verification failed', error);
      setError(error?.message || 'OTP verification failed. Please try again.');
    },
  });

  const initOtpWidget = () => {
    if (!window.initSendOTP) {
      setError('OTP widget is not loaded yet. Please wait and try again.');
      return;
    }

    if (!widgetToken) {
      console.warn('MSG91 widget token is not configured. Using empty tokenAuth fallback.');
    }

    setError('');

    try {
      window.initSendOTP(getOtpWidgetConfiguration(identifierForWidget || ''));
    } catch (err) {
      console.error('Failed to initialize OTP widget:', err);
      setError('Failed to load OTP widget. Please refresh the page and try again.');
    }
  };

  const handleResendOtp = () => {
    if (!window.initSendOTP) {
      setError('OTP widget is not ready to resend yet. Please wait.');
      return;
    }

    if (!widgetToken) {
      console.warn('MSG91 widget token is not configured. Using empty tokenAuth fallback.');
    }

    setError('');
    setIsResendingOtp(true);

    try {
      window.initSendOTP(getOtpWidgetConfiguration(identifierForWidget || ''));
    } catch (err) {
      console.error('Failed to resend OTP:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  useEffect(() => {
    if (!showOtpWidget || method !== 'mobile') return;

    if (window.initSendOTP) {
      initOtpWidget();
      return;
    }

    if (otpWidgetLoaded) {
      initOtpWidget();
    }
  }, [showOtpWidget, identifierForWidget, method, otpWidgetLoaded, widgetToken]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (method === 'email' && !isValidEmail(identifier)) {
      setError('Enter a valid email address.');
      return;
    }

    if (method === 'mobile' && !isValidMobile(identifier)) {
      setError('Enter a valid Indian mobile number (10 digits).');
      return;
    }

    if (method === 'mobile') {
      // For mobile, show widget
      const normalizedMobile = identifier.replace(/\D/g, '').slice(-10);
      setIdentifierForWidget(normalizedMobile);
      setShowOtpWidget(true);
    } else {
      // For email, send OTP via API
      setLoading(true);
      try {
        const res = await fetch('/api/otp/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send', identifier, method: 'email' }),
        });

        const data = await res.json();

        if (res.ok) {
          setMessage(`OTP sent to ${data.maskedEmail}`);
          setUserId(data.userId);
          setStep('otp');
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
    }
  };

  const handleVerifyEmailOtp = async (emailOtp: string) => {
    setError('');
    setMessage('');
    setLoading(true);

    if (!emailOtp || emailOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/otp/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', identifier, otp: emailOtp }),
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
      <Script
        src="https://verify.msg91.com/otp-provider.js"
        strategy="lazyOnload"
        onLoad={() => setOtpWidgetLoaded(true)}
        onError={() => setError('Failed to load MSG91 OTP widget script.')}
      />
      <Script
        src="https://verify.phone91.com/otp-provider.js"
        strategy="lazyOnload"
        onLoad={() => setOtpWidgetLoaded(true)}
        onError={() => setError('Failed to load MSG91 OTP widget script.')}
      />

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-red-600">
          🔐 Forgot Password
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 text-red-700 rounded-lg font-semibold text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-400 text-green-700 rounded-lg font-semibold text-sm">
            {message}
          </div>
        )}

        {/* Step 1: Identify */}
        {step === 'identify' && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                Send OTP via
              </label>
              <div className="flex flex-wrap gap-4 mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="otpMethod"
                    value="email"
                    checked={method === 'email'}
                    onChange={() => setMethod('email')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-900">Email</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="otpMethod"
                    value="mobile"
                    checked={method === 'mobile'}
                    onChange={() => setMethod('mobile')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-900">Mobile</span>
                </label>
              </div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                {method === 'email' ? 'Email Address' : 'Mobile Number'}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={method === 'email' ? 'Enter your email' : 'Enter your mobile'}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification (Mobile with Widget) */}
        {step === 'otp' && method === 'mobile' && showOtpWidget && (
          <div className="space-y-4">
            <p className="text-gray-700 text-sm font-semibold">Verify your mobile number to reset password</p>
            {!otpWidgetLoaded && (
              <p className="text-sm text-gray-600">Loading OTP widget. Please wait...</p>
            )}
            <div id="otp-widget-container" className="border rounded p-4">
              {/* MSG91 OTP Widget will be rendered here */}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!otpWidgetLoaded || isResendingOtp}
                className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isResendingOtp ? 'Resending OTP...' : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOtpWidget(false);
                  setStep('identify');
                  setError('');
                }}
                className="w-full bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400 text-sm"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification (Email) */}
        {step === 'otp' && method === 'email' && (
          <EmailOtpStep
            identifier={identifier}
            onVerify={handleVerifyEmailOtp}
            onBack={() => {
              setStep('identify');
              setMessage('');
              setError('');
            }}
            loading={loading}
          />
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
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 text-sm"
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
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper component for email OTP verification
function EmailOtpStep({
  identifier,
  onVerify,
  onBack,
  loading,
}: {
  identifier: string;
  onVerify: (otp: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}) {
  const [emailOtp, setEmailOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onVerify(emailOtp);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-900 font-semibold mb-2 text-sm">
          Enter 6-Digit OTP
        </label>
        <p className="text-sm text-gray-600 mb-3">
          We&apos;ve sent an OTP to your email address
        </p>
        <input
          type="text"
          value={emailOtp}
          onChange={(e) => setEmailOtp(e.target.value.slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 text-center text-2xl tracking-widest font-mono"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full mt-2 bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400 text-sm"
      >
        Back
      </button>
    </form>
  );
}