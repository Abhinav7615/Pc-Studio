'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [checkingAdmin, setCheckingAdmin] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAdminError('');

    // Use signIn with admin credentials check
    const result = await signIn('credentials', {
      identifier,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (isAdminMode) {
        setAdminError('Invalid admin credentials');
      } else {
        setError('Invalid email/mobile or password');
      }
      setLoading(false);
      return;
    }

    if (result?.ok) {
      // Check user role after login
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (isAdminMode || isStaffMode) {
        // Admin/Staff login - verify role and redirect
        if (session?.user?.role === 'admin' || session?.user?.role === 'staff') {
          router.push('/admin');
        } else {
          setAdminError('You do not have admin/staff access');
          setLoading(false);
        }
      } else {
        // Customer login - redirect to home
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">
          {isAdminMode ? '🔐 Admin Login' : isStaffMode ? '👤 Staff Login' : 'Customer Login'}
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
            <label className="block text-gray-900 font-bold mb-1">
              {isAdminMode ? 'Admin Email' : isStaffMode ? 'Staff Email' : 'Email or Mobile'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={`w-full px-3 py-2 border rounded focus:outline-none text-gray-900 placeholder-gray-400
                ${isAdminMode ? 'border-red-400 focus:border-red-600' : isStaffMode ? 'border-orange-400 focus:border-orange-600' : 'border-gray-300 focus:border-blue-600'}
              `}
              required
              placeholder={isAdminMode ? 'Enter admin email' : isStaffMode ? 'Enter staff email' : 'Enter email or mobile'}
            />
            {checkingAdmin && identifier.trim() && (
              <p className="text-xs text-gray-500 mt-1">Checking admin/staff access...</p>
            )}
            {(isAdminMode || isStaffMode) && !checkingAdmin && (
              <p className={`text-xs font-semibold mt-1 ${isAdminMode ? 'text-red-600' : 'text-orange-600'}`}>🔐 {isAdminMode ? 'Admin' : 'Staff'} Mode Detected</p>
            )}
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
            disabled={loading || checkingAdmin}
            className={`w-full font-bold py-2 rounded transition disabled:opacity-50
              ${isAdminMode 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : isStaffMode
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {loading ? 'Logging in...' : isAdminMode ? 'Admin Login' : isStaffMode ? 'Staff Login' : 'Login'}
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