'use client';

import { useState } from 'react';
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
  const [userReferralCode, setUserReferralCode] = useState('');
  const [inviteeCouponCode, setInviteeCouponCode] = useState('');
  const [inviteeCouponAmount, setInviteeCouponAmount] = useState(0);
  const [inviteeDiscountReceived, setInviteeDiscountReceived] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidMobile = (mobile: string) => {
    return /^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(mobile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!form.name || !form.email || !form.mobile || !form.password || !form.passwordHint) {
      setError('All fields are required');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Invalid email format');
      return;
    }

    if (!isValidMobile(form.mobile)) {
      setError('Invalid mobile number. It should be a valid 10-digit Indian number.');
      return;
    }

    const res = await fetch('/api/otp/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', email: form.email }),
    });

    const data = await res.json();
    if (res.ok) {
      setOtpSent(true);
      setSuccessMessage(`OTP sent to ${data.email}. Please check your email.`);
      setError('');
      if (data.otp) {
        setDebugOtp(data.otp);
      }
    } else {
      setError(data.error || 'Unable to send OTP');
      setSuccessMessage('');
      setDebugOtp('');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccessMessage('');

    if (!otpValue.trim()) {
      setError('Please enter OTP');
      return;
    }

    const res = await fetch('/api/otp/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', email: form.email, otp: otpValue.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'OTP verification failed');
      return;
    }

    // Now complete registration
    const registerRes = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, registerToken: data.registerToken }),
    });

    if (registerRes.ok) {
      const responseData = await registerRes.json();
      setUserReferralCode(responseData.referralCode);
      if (responseData.inviteeCouponCode) {
        setInviteeCouponCode(responseData.inviteeCouponCode);
        setInviteeCouponAmount(responseData.inviteeCouponAmount || 0);
        setInviteeDiscountReceived(true);
      }
      setSuccessMessage('Registration successful! Here is your referral code:');
      setOtpSent(false);
      setOtpValue('');
      setRegistrationComplete(true);
      setForm({ name: '', email: '', mobile: '', password: '', passwordHint: '', invitationCode: '' });
    } else {
      const responseData = await registerRes.json();
      setError(responseData.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-red-600">Register</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {successMessage && !registrationComplete && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">{successMessage}</p>
            {debugOtp && (
              <p className="text-sm mt-2 font-mono text-blue-700">OTP (development): {debugOtp}</p>
            )}
          </div>
        )}

        {registrationComplete && successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">{successMessage}</p>
            
            {inviteeDiscountReceived && inviteeCouponCode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                <p className="font-semibold text-yellow-800 mb-2">🎉 Welcome Bonus - Invitee Discount!</p>
                <p className="text-sm text-yellow-700 mb-2">You received a discount coupon from your friend&apos;s referral!</p>
                <p className="text-sm font-bold text-yellow-900">Discount: ₹{inviteeCouponAmount}</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm font-semibold text-yellow-800">Coupon Code:</p>
                  <code className="bg-white px-2 py-1 rounded border font-mono text-sm font-bold text-blue-600">
                    {inviteeCouponCode}
                  </code>
                  <button
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
              onClick={() => router.push('/login')}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Continue to Login
            </button>
          </div>
        )}
        {!registrationComplete && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold">Mobile</label>
                  <input
                    type="text"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded bg-white text-gray-900 placeholder-gray-500"
                      required
                      aria-label="Password"
                      placeholder="Choose a strong password"
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
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold">Password Hint</label>
                  <input
                    type="text"
                    name="passwordHint"
                    value={form.passwordHint}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold">Invitation Code (Optional)</label>
                  <input
                    type="text"
                    name="invitationCode"
                    value={form.invitationCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500"
                    placeholder="Enter friend's referral code"
                  />
                  <p className="text-sm text-gray-700 mt-1">Get discount on your first order by using a referral code</p>
                </div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200">
                  Send OTP to Email
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold">Email OTP</label>
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500"
                    placeholder="Enter OTP"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200"
                >
                  Verify OTP & Complete Registration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpValue('');
                    setSuccessMessage('');
                    setError('');
                  }}
                  className="w-full bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400"
                >
                  Change Email / Details
                </button>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link href="/login" className="text-blue-600 hover:text-blue-800">Already have an account? Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}