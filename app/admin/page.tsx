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

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        setLoadingStats(true);
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted) setStats(data);
      } catch (err) {
        if (mounted) setStats({ totalOrders: 0, pendingPayments: 0, totalProducts: 0, totalUsers: 0 });
      } finally {
        if (mounted) setLoadingStats(false);
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Link href="/admin" className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-center">
              Dashboard
            </Link>
            <Link href="/admin/products" className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center">
              Products
            </Link>
            <Link href="/admin/orders" className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center">
              Orders
            </Link>
            <Link href="/admin/users" className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center">
              Users
            </Link>
            <Link href="/admin/content" className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center">
              Content
            </Link>
            <Link href="/admin/settings" className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center">
              Settings
            </Link>
          </div>
        </nav>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              </div>
              <div className="text-4xl text-blue-500">📦</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Pending Payments</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.pendingPayments || 0}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Total Products</p>
                <p className="text-3xl font-bold text-green-600">{stats?.totalProducts || 0}</p>
              </div>
              <div className="text-4xl">💻</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Total Users</p>
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
              <p className="text-sm text-gray-600">Create a new product listing</p>
            </Link>
            <Link href="/admin/orders" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">✅ Verify Payments</p>
              <p className="text-sm text-gray-600">Review pending payments</p>
            </Link>
            <Link href="/admin/users" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">👤 Manage Users</p>
              <p className="text-sm text-gray-600">Add, edit, or remove users</p>
            </Link>
            <Link href="/admin/content" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">📝 Manage Content</p>
              <p className="text-sm text-gray-600">Edit website text and pages</p>
            </Link>
            <Link href="/admin/settings" className="p-4 border-2 border-gray-200 rounded hover:border-red-600 hover:bg-red-50 transition">
              <p className="font-bold text-gray-900">⚙️ Business Settings</p>
              <p className="text-sm text-gray-600">Update contact & payment info</p>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
          <div className="max-w-md">
            {pwdMsg && <div className="mb-3 text-sm text-center">{pwdMsg}</div>}
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <div className="flex space-x-2">
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
                  } catch (err) {
                    setPwdMsg('Request failed');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Password
              </button>
              <button
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setPwdMsg(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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