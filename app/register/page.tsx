'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    passwordHint: '',
    invitationCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userReferralCode, setUserReferralCode] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for referral code in URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      setForm(prev => ({ ...prev, invitationCode: refCode.toUpperCase() }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setUserReferralCode(data.referralCode);
      setSuccessMessage('Registration successful! Here is your referral code:');
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">{successMessage}</p>
            <div className="mt-2 flex items-center gap-2">
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
        {!successMessage && (
          <>
            <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-900 font-semibold">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400"
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
              className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400"
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
              className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400"
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
                className="w-full px-3 py-2 border rounded bg-white text-gray-900 placeholder-gray-400"
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
              className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400"
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
              className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400"
              placeholder="Enter friend's referral code"
            />
            <p className="text-sm text-gray-700 mt-1">Get discount on your first order by using a referral code</p>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200">
            Register
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-blue-600 hover:text-blue-800">Already have an account? Login</Link>
        </div>
        </>
        )}
      </div>
    </div>
  );
}