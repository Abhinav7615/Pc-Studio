'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  totalOrders: number;
  pendingPayments: number;
  totalProducts: number;
  totalUsers: number;
}

interface BusinessSettings {
  siteOpen?: boolean;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [siteOpen, setSiteOpen] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  const loadSiteSettings = async () => {
    try {
      const res = await fetch('/api/business-settings');
      if (res.ok) {
        const data: BusinessSettings = await res.json();
        setSiteOpen(data.siteOpen ?? true);
      }
    } catch (_err) {
      setSiteOpen(true);
    }
  };

  const toggleSiteOpen = async () => {
    setSettingsLoading(true);
    try {
      const newSiteOpen = !siteOpen;
      const res = await fetch('/api/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteOpen: newSiteOpen }),
      });
      if (res.ok) {
        const updatedData = await res.json();
        setSiteOpen(updatedData.siteOpen); // Use the value from API response
      } else {
        // Reload settings to ensure we're in sync
        await loadSiteSettings();
      }
    } catch (_err) {
      // Reload settings on error to ensure we're in sync
      await loadSiteSettings();
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadSiteSettings();
    }
  }, [status]);

  // Also load settings on mount to ensure UI is correct
  useEffect(() => {
    loadSiteSettings();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted) setStats(data);
      } catch (_err) {
        if (mounted) setStats({ totalOrders: 0, pendingPayments: 0, totalProducts: 0, totalUsers: 0 });
      }
    }

    loadStats();
    const t = setInterval(loadStats, 10000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100 text-sm">Welcome, {session?.user?.name || 'Admin'}</p>
            </div>
            <div className="space-x-4">
              <span className="text-red-100">Role: {session?.user?.role}</span>
              <button
                onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
                className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="bg-white rounded-lg shadow p-4 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-9 gap-4">
            <Link href="/admin" className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-center">
              Dashboard
            </Link>
            <Link href="/admin/products" className="px-3 py-2 bg-gray-200 text-gray-900 font-semibold rounded hover:bg-gray-300 text-center">
              Products
            </Link>
            <Link href="/admin/orders" className="px-3 py-2 bg-gray-200 text-gray-900 font-semibold rounded hover:bg-gray-300 text-center">
              Orders
            </Link>
            <Link href="/admin/users" className="px-3 py-2 bg-gray-200 text-gray-900 font-semibold rounded hover:bg-gray-300 text-center">
              Users
            </Link>
            <Link href="/admin/content" className="px-3 py-2 bg-gray-200 text-gray-900 font-semibold rounded hover:bg-gray-300 text-center">
              Content
            </Link>
            <Link href="/admin/settings" className="px-3 py-2 bg-gray-200 text-gray-900 font-semibold rounded hover:bg-gray-300 text-center">
              Settings
            </Link>
            <Link href="/admin/credentials" className="px-3 py-2 bg-gray-200 text-gray-900 font-semibold rounded hover:bg-gray-300 text-center">
              Credentials
            </Link>
            <Link href="/admin/coupons" className="px-3 py-2 bg-gray-200 text-gray-900 font-semibold rounded hover:bg-gray-300 text-center">
              Coupons
            </Link>
            <Link href="/admin/theme" className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded hover:from-indigo-600 hover:to-purple-700 text-center">
              🎨 Theme
            </Link>
          </div>
        </nav>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h2>
        
        <div className={`mb-8 p-6 rounded-lg shadow-lg border-2 ${siteOpen ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`text-5xl ${siteOpen ? 'text-green-600' : 'text-red-600'}`}>
                {siteOpen ? '✅' : '🛑'}
              </div>
              <div>
                <p className={`text-sm font-semibold ${siteOpen ? 'text-green-700' : 'text-red-700'}`}>Website Status</p>
                <p className={`text-3xl font-bold ${siteOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {siteOpen ? 'OPEN' : 'CLOSED'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSiteOpen}
              disabled={settingsLoading}
              className={`px-6 py-3 text-white font-semibold rounded-lg hover:shadow-lg transition ${
                siteOpen 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {settingsLoading ? 'Updating...' : (siteOpen ? 'Close Site' : 'Open Site')}
            </button>
          </div>
          <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-sm text-blue-900">
            <p><strong>ℹ️ How it works:</strong> This toggle controls whether the website is accessible to customers.</p>
            <p className="mt-1">• <strong>OPEN:</strong> Customers can browse. Schedule and 24/7 settings in Settings page apply.</p>
            <p>• <strong>CLOSED:</strong> Customers see &quot;Website Temporarily Closed&quot; message. Admins can still access.</p>
            <p className="mt-1">💡 <strong>Tip:</strong> Go to Settings → Website Close Schedule to enable 24/7 mode or set day-wise hours.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-semibold">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              </div>
              <div className="text-4xl text-blue-500">📦</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-semibold">Pending Payments</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.pendingPayments || 0}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-semibold">Total Products</p>
                <p className="text-3xl font-bold text-green-600">{stats?.totalProducts || 0}</p>
              </div>
              <div className="text-4xl">💻</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-semibold">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.totalUsers || 0}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/products" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">➕ Add New Product</p>
              <p className="text-sm text-gray-700 font-medium">Create a new product listing</p>
            </Link>
            <Link href="/admin/orders" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">✅ Verify Payments</p>
              <p className="text-sm text-gray-700 font-medium">Review pending payments</p>
            </Link>
            <Link href="/admin/users" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">👤 Manage Users</p>
              <p className="text-sm text-gray-700 font-medium">Add, edit, or remove users</p>
            </Link>
            <Link href="/admin/credentials" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">🔐 Change Credentials</p>
              <p className="text-sm text-gray-700 font-medium">Update admin email & password</p>
            </Link>
            <Link href="/admin/content" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">📝 Manage Content</p>
              <p className="text-sm text-gray-700 font-medium">Edit website text and pages</p>
            </Link>
            <Link href="/admin/settings" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">⚙️ Business Settings</p>
              <p className="text-sm text-gray-700 font-medium">Update contact & payment info</p>
            </Link>
            <Link href="/admin/coupons" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">🎫 Manage Coupons</p>
              <p className="text-sm text-gray-700 font-medium">Create and manage discount coupons</p>
            </Link>
            <Link href="/admin/theme" className="p-4 border-2 border-gray-200 rounded hover:border-indigo-600 hover:bg-indigo-50 transition bg-gradient-to-br from-indigo-50 to-purple-50">
              <p className="font-bold text-indigo-900">🎨 Theme Customization</p>
              <p className="text-sm text-indigo-700 font-medium">Customize customer interface colors & sections</p>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
          <div className="max-w-md">
            {pwdMsg && (
              <div className={`mb-3 text-sm text-center font-medium ${
                pwdMsg === 'Password updated' ? 'text-green-700' : 'text-red-700'
              }`}>
                {pwdMsg}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  setPwdMsg(null);
                  try {
                    const res = await fetch('/api/admin/change-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setPwdMsg(data?.error || 'Failed to change password');
                    } else {
                      setPwdMsg('Password updated');
                      setCurrentPassword('');
                      setNewPassword('');
                    }
                  } catch (_err) {
                    setPwdMsg('Request failed');
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Password
              </button>
              <button
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setPwdMsg(null);
                }}
                className="px-6 py-2 bg-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}