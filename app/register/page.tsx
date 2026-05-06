'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialReferral = searchParams.get('ref')?.toUpperCase() || '';

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    passwordHint: '',
    invitationCode: initialReferral,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [userReferralCode, setUserReferralCode] = useState('');
  const [inviteeCouponCode, setInviteeCouponCode] = useState('');
  const [inviteeCouponAmount, setInviteeCouponAmount] = useState(0);
  const [inviteeDiscountReceived, setInviteeDiscountReceived] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSendEmailOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationMessage('');

    if (!form.name || !form.email || !form.mobile || !form.password || !form.passwordHint) {
      setError('All fields are required before sending the OTP.');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Invalid email format');
      return;
    }

    setIsSendingOtp(true);

    try {
      const res = await fetch('/api/otp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: form.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerificationMessage(data.message || 'OTP sent to your email address.');
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('Error sending email OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationMessage('');

    if (!emailOtp.trim() || emailOtp.trim().length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const res = await fetch('/api/otp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: form.email, otp: emailOtp.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailVerified(true);
        setVerificationMessage('Email verified successfully. You can now complete registration.');
      } else {
        setError(data.error || 'Invalid OTP.');
      }
    } catch (err) {
      console.error('Error verifying email OTP:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCompleteRegistration = async () => {
    setError('');
    setSuccessMessage('');

    if (!emailVerified) {
      setError('Verify your email with OTP before registering.');
      return;
    }

    setIsRegistering(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      setUserReferralCode(data.referralCode);
      if (data.inviteeCouponCode) {
        setInviteeCouponCode(data.inviteeCouponCode);
        setInviteeCouponAmount(data.inviteeCouponAmount || 0);
        setInviteeDiscountReceived(true);
      }
      setSuccessMessage('Registration successful! Here is your referral code:');
      setRegistrationComplete(true);
      setForm({ name: '', email: '', mobile: '', password: '', passwordHint: '', invitationCode: '' });
      setEmailOtp('');
      setEmailVerified(false);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration error. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div id="recaptcha-container" className="hidden" />
        <h2 className="text-2xl font-bold mb-6 text-center text-red-600">Register</h2>
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
        {verificationMessage && !registrationComplete && (
          <div className="bg-blue-50 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
            {verificationMessage}
          </div>
        )}
        {successMessage && !registrationComplete && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold text-sm">{successMessage}</p>
          </div>
        )}

        {registrationComplete ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold text-sm">{successMessage}</p>
            {inviteeDiscountReceived && inviteeCouponCode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                <p className="font-semibold text-yellow-800 mb-2 text-sm">🎉 Welcome Bonus - Invitee Discount!</p>
                <p className="text-xs text-yellow-700 mb-2">You received a discount coupon from your friend&apos;s referral!</p>
                <p className="text-xs font-bold text-yellow-900">Discount: ₹{inviteeCouponAmount}</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xs font-semibold text-yellow-800">Coupon Code:</p>
                  <code className="bg-white px-2 py-1 rounded border font-mono text-xs font-bold text-blue-600">
                    {inviteeCouponCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteeCouponCode);
                      alert('Coupon code copied!');
                    }}
                    className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 text-xs"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-2">Use this coupon when placing your first order!</p>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <code className="bg-white px-2 py-1 rounded border font-mono text-lg font-bold text-blue-600">
                {userReferralCode}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(userReferralCode);
                  alert('Referral code copied!');
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-sm mt-2">Share this code with friends to earn rewards when they shop!</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
            >
              Continue to Login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSendEmailOtp}>
              <div className="mb-4">
                <label className="block text-gray-900 font-semibold text-sm">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-semibold text-sm">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-semibold text-sm">Mobile (required)</label>
                <input
                  type="text"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-semibold text-sm">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded bg-white text-gray-900 placeholder-gray-500 text-sm"
                    required
                    aria-label="Password"
                    placeholder="Choose a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-700 px-2 py-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-semibold text-sm">Password Hint *</label>
                <input
                  type="text"
                  name="passwordHint"
                  value={form.passwordHint}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-semibold text-sm">Invitation Code (Optional)</label>
                <input
                  type="text"
                  name="invitationCode"
                  value={form.invitationCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                  placeholder="Enter friend's referral code"
                />
                <p className="text-xs text-gray-700 mt-1">Get discount on your first order by using a referral code</p>
              </div>
              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 text-sm disabled:opacity-50"
              >
                {isSendingOtp ? 'Sending OTP...' : 'Send OTP to Email'}
              </button>
            </form>

            {verificationMessage && !emailVerified && (
              <form onSubmit={handleVerifyEmailOtp} className="mt-4">
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold text-sm">Enter Email OTP</label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                    placeholder="6-digit OTP"
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            {emailVerified && (
              <div className="mt-4">
                <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                  Email verified successfully. Complete registration to create your account.
                </div>
                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={isRegistering}
                  className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {isRegistering ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm">Already have an account? Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

