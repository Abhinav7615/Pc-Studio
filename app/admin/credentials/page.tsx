'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CredentialForm {
  newAdminEmail?: string;
  newAdminPassword?: string;
  confirmPassword?: string;
  currentPassword: string;
}

export default function AdminCredentials() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<CredentialForm>({
    newAdminEmail: '',
    newAdminPassword: '',
    confirmPassword: '',
    currentPassword: '',
  });
  const isMainAdmin = !!(session?.user as { adminEmail?: string })?.adminEmail;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (status === 'authenticated' && !isMainAdmin) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔐 Access Restricted</h1>
          <p className="text-gray-700 mb-4">
            Only the main admin can change the admin email and password used for admin login.
          </p>
          <p className="text-gray-700 mb-6">
            If you are an additional admin, use your personal profile page to update your own name, email, mobile, and password hint.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to My Profile
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!form.newAdminEmail || !form.currentPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newAdminEmail: form.newAdminEmail,
          currentPassword: form.currentPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Admin email updated successfully! Please log in again with the new email.');
        setForm({ ...form, newAdminEmail: '', currentPassword: '' });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Failed to update email');
      }
    } catch (_err) {
      setError('An error occurred. Please try again.');
      console.error(_err);
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!form.newAdminPassword || !form.confirmPassword || !form.currentPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (form.newAdminPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (form.newAdminPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: form.newAdminPassword,
          currentPassword: form.currentPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Admin password updated successfully!');
        setForm({ ...form, newAdminPassword: '', confirmPassword: '', currentPassword: '' });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (_err) {
      setError('An error occurred. Please try again.');
      console.error(_err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 Admin Credentials Management</h1>

        {session?.user?.role === 'staff' && (
          <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
            <p className="text-yellow-800 font-semibold text-lg">⚠️ Admin Only</p>
            <p className="text-yellow-800 text-sm font-medium mt-1">Only administrators can change admin email and password. Staff members have read-only access to this section.</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('email');
                setError('');
                setSuccess('');
              }}
              disabled={session?.user?.role === 'staff'}
              className={`flex-1 py-4 px-6 font-semibold text-center transition ${
                activeTab === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${session?.user?.role === 'staff' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ✉️ Change Admin Email
            </button>
            <button
              onClick={() => {
                setActiveTab('password');
                setError('');
                setSuccess('');
              }}
              disabled={session?.user?.role === 'staff'}
              className={`flex-1 py-4 px-6 font-semibold text-center transition ${
                activeTab === 'password'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${session?.user?.role === 'staff' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🔑 Change Admin Password
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-100 border-2 border-green-400 text-green-700 rounded-lg font-semibold">
                {success}
              </div>
            )}

            {/* Change Email Tab */}
            {activeTab === 'email' && (
              <form onSubmit={handleChangeEmail} className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-medium">
                    ℹ️ <strong>Admin Email:</strong> This is a special email address that enables admin mode in the customer login form. When you enter this email on the login page, the system automatically recognizes you as an admin and shows admin login options.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    New Admin Email
                  </label>
                  <input
                    type="text"
                    name="newAdminEmail"
                    value={form.newAdminEmail || ''}
                    onChange={handleChange}
                    placeholder="Enter new admin email (e.g., admin@example.com)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Current Password (for verification)
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter your current password"
                    disabled={session?.user?.role === 'staff'}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || session?.user?.role === 'staff'}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                >
                  {session?.user?.role === 'staff' ? '🔒 Admin Only' : loading ? '⏳ Updating...' : '✅ Update Admin Email'}
                </button>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-900">
                    <strong>How it works:</strong> After updating, go to the customer login page (/login), enter this admin email, and you&apos;ll see it automatically switch to Admin Mode with a red border.
                  </p>
                </div>
              </form>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-medium">
                    ℹ️ <strong>Admin Password:</strong> This is a separate password used specifically for admin panel access. It&apos;s different from your customer account password and provides an additional security layer.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    New Admin Password
                  </label>
                  <input
                    type="password"
                    name="newAdminPassword"
                    value={form.newAdminPassword || ''}
                    onChange={handleChange}
                    placeholder="Enter new admin password (min 6 characters)"
                    disabled={session?.user?.role === 'staff'}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword || ''}
                    onChange={handleChange}
                    placeholder="Confirm new admin password"
                    disabled={session?.user?.role === 'staff'}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Current Password (for verification)
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter your current password"
                    disabled={session?.user?.role === 'staff'}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 placeholder-gray-500 bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || session?.user?.role === 'staff'}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                >
                  {session?.user?.role === 'staff' ? '🔒 Admin Only' : loading ? '⏳ Updating...' : '✅ Update Admin Password'}
                </button>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900 font-medium">
                    <strong>💡 How to use:</strong> Go to /login, enter your admin email, and when it switches to Admin Mode, use your new admin password to log in.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ <strong>Important:</strong> Your admin credentials are separate from your customer account. Use the admin email and password ONLY when accessing the admin panel through the login form. Never share these credentials with anyone.
          </p>
        </div>
      </div>
    </div>
  );
}
