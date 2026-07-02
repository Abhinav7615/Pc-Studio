'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminProvidersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') loadProviders();
  }, [status]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/providers');
      if (!res.ok) return;
      let data = await res.json();
      if (search) {
        const s = search.toLowerCase();
        data = data.filter((p: any) => p.name?.toLowerCase().includes(s));
      }
      setProviders(data);
      setSelectedProviders(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = (id: string) => {
    const newSelected = new Set(selectedProviders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProviders(newSelected);
  };

  const doBulkAction = async () => {
    if (!bulkAction || selectedProviders.size === 0) return;
    try {
      const res = await fetch('/api/admin/providers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          ids: Array.from(selectedProviders),
        }),
      });
      if (res.ok) {
        loadProviders();
        setBulkAction('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const duplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/providers/${id}/duplicate`, { method: 'POST' });
      if (res.ok) loadProviders();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' });
      if (res.ok) loadProviders();
    } catch (err) {
      console.error(err);
    }
  };

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ad Providers</h1>
            <p className="text-gray-700">Manage advertisement providers (Google AdSense, Monetag, etc.)</p>
          </div>
          <Link href="/admin/providers/create" className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
            ➕ Create Provider
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search providers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={loadProviders}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
            >
              🔄 Refresh
            </button>
            {selectedProviders.size > 0 && (
              <div className="flex gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm flex-1"
                >
                  <option value="">Select action ({selectedProviders.size} selected)...</option>
                  <option value="enable">Enable</option>
                  <option value="disable">Disable</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={doBulkAction}
                  disabled={!bulkAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">Loading providers...</div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No providers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 text-left"><input type="checkbox" onChange={(e) => setSelectedProviders(e.target.checked ? new Set(providers.map(p => String(p._id))) : new Set())} /></th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Priority</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p._id} className="border-b hover:bg-gray-50">
                      <td className="p-2"><input type="checkbox" checked={selectedProviders.has(String(p._id))} onChange={() => toggleProvider(String(p._id))} /></td>
                      <td className="p-2 font-semibold">{p.name}</td>
                      <td className="p-2">{p.type || '—'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'enabled' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-2">{p.priority || 0}</td>
                      <td className="p-2 space-x-1">
                        <Link href={`/admin/providers/${p._id}`} className="text-blue-600 hover:underline text-xs font-semibold">Edit</Link>
                        <button onClick={() => duplicate(p._id)} className="text-purple-600 hover:underline text-xs font-semibold">Copy</button>
                        <button onClick={() => deleteProvider(p._id)} className="text-red-600 hover:underline text-xs font-semibold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/providers/audit" className="p-4 bg-white rounded-lg shadow hover:shadow-lg border-2 border-gray-200">
            <p className="font-bold text-lg text-gray-900">📋 Audit Log</p>
            <p className="text-sm text-gray-700">View provider modification history</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
