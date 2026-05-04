'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

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
  const [showOtpWidget, setShowOtpWidget] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpWidgetLoaded, setOtpWidgetLoaded] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [showEmailOtpVerification, setShowEmailOtpVerification] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [registerTokenFromOtp, setRegisterTokenFromOtp] = useState('');
  const widgetToken = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || '';

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidMobile = (mobile: string) => {
    return /^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(mobile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getOtpWidgetConfiguration = (identifier: string) => ({
    widgetId: '366441705372363439393933',
    tokenAuth: widgetToken,
    identifier,
    exposeMethods: 'true',
    success: async (data: any) => {
      console.log('OTP verified successfully', data);
      const token = data.token || data.tokenAuth || '';
      setOtpToken(token);
      setShowOtpWidget(false);
      await handleCompleteRegistration(token);
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
      window.initSendOTP(getOtpWidgetConfiguration(form.mobile || ''));
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
      window.initSendOTP(getOtpWidgetConfiguration(form.mobile || ''));
    } catch (err) {
      console.error('Failed to resend OTP:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  useEffect(() => {
    if (!showOtpWidget) return;

    if (window.initSendOTP) {
      initOtpWidget();
      return;
    }

    if (otpWidgetLoaded) {
      initOtpWidget();
    }
  }, [showOtpWidget, otpWidgetLoaded, form.mobile, widgetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!form.name || !form.email || !form.password || !form.passwordHint) {
      setError('Name, email, password, and password hint are required');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Invalid email format');
      return;
    }

    // Send email OTP
    setError('');
    try {
      const res = await fetch('/api/otp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: form.email,
          mobile: form.mobile || '', // optional
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('OTP sent to your email. Please check your inbox.');
        setShowEmailOtpVerification(true);
        setEmailOtp('');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Error sending OTP. Please try again.');
    }
  };

  const handleCompleteRegistration = async (token: string = '', regToken: string = '') => {
    try {
      const registerRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          otpToken: token || undefined,
          registerToken: regToken || undefined,
        }),
      });

      const responseData = await registerRes.json();

      if (registerRes.ok) {
        setUserReferralCode(responseData.referralCode);
        if (responseData.inviteeCouponCode) {
          setInviteeCouponCode(responseData.inviteeCouponCode);
          setInviteeCouponAmount(responseData.inviteeCouponAmount || 0);
          setInviteeDiscountReceived(true);
        }
        setSuccessMessage('Registration successful! Here is your referral code:');
        setRegistrationComplete(true);
        setForm({ name: '', email: '', mobile: '', password: '', passwordHint: '', invitationCode: '' });
      } else {
        setError(responseData.error || 'Registration failed');
        setShowOtpWidget(false);
      }
    } catch (err) {
      setError('Registration error. Please try again.');
      setShowOtpWidget(false);
      console.error(err);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.trim().length === 0) {
      setError('Please enter the OTP');
      return;
    }

    setError('');
    setIsVerifyingOtp(true);

    try {
      const res = await fetch('/api/otp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: form.email,
          emailOtp: emailOtp.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.registerToken) {
        setRegisterTokenFromOtp(data.registerToken);
        setSuccessMessage('OTP verified! Completing registration...');
        setTimeout(() => {
          handleCompleteRegistration('', data.registerToken);
        }, 500);
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Error verifying OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
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
        <h2 className="text-2xl font-bold mb-6 text-center text-red-600">Register</h2>
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
        {successMessage && !registrationComplete && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold text-sm">{successMessage}</p>
          </div>
        )}

        {registrationComplete && successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold text-sm">{successMessage}</p>
            
            {inviteeDiscountReceived && inviteeCouponCode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                <p className="font-semibold text-yellow-800 mb-2 text-sm">🎉 Welcome Bonus - Invitee Discount!</p>
                <p className="text-xs text-yellow-700 mb-2">You received a discount coupon from your friend's referral!</p>
                <p className="text-xs font-bold text-yellow-900">Discount: ₹{inviteeCouponAmount}</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xs font-semibold text-yellow-800">Coupon Code:</p>
                  <code className="bg-white px-2 py-1 rounded border font-mono text-xs font-bold text-blue-600">
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
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
            >
              Continue to Login
            </button>
          </div>
        )}

        {!registrationComplete && (
          <>
            {!showEmailOtpVerification && !showOtpWidget ? (
              <form onSubmit={handleSubmit}>
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
                  <label className="block text-gray-900 font-semibold text-sm">Mobile (optional)</label>
                  <input
                    type="text"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 text-sm"
                    placeholder="10-digit mobile number (optional for now)"
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
                  className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 text-sm"
                >
                  Send OTP
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700 text-sm font-semibold">Verify your mobile number to complete registration</p>
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
                      setError('');
                    }}
                    className="w-full bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400 text-sm"
                  >
                    Back
                  </button>
                </div>
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