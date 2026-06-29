'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminZonesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZones, setSelectedZones] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') loadZones();
  }, [status]);

  const loadZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/zones');
      if (!res.ok) return;
      let data = await res.json();
      if (search) {
        const s = search.toLowerCase();
        data = data.filter((z: any) => z.key?.toLowerCase().includes(s) || z.title?.toLowerCase().includes(s));
      }
      setZones(data);
      setSelectedZones(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleZone = (id: string) => {
    const newSelected = new Set(selectedZones);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedZones(newSelected);
  };

  const doBulkAction = async () => {
    if (!bulkAction || selectedZones.size === 0) return;
    try {
      const res = await fetch('/api/admin/zones/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          ids: Array.from(selectedZones),
        }),
      });
      if (res.ok) {
        loadZones();
        setBulkAction('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const duplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/zones/${id}/duplicate`, { method: 'POST' });
      if (res.ok) loadZones();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteZone = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/zones/${id}`, { method: 'DELETE' });
      if (res.ok) loadZones();
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
            <h1 className="text-3xl font-bold text-gray-900">Advertisement Zones</h1>
            <p className="text-gray-700">Define ad placement locations on your website (header, sidebar, footer, etc.)</p>
          </div>
          <Link href="/admin/zones/create" className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
            ➕ Create Zone
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search zones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={loadZones}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
            >
              🔄 Refresh
            </button>
            {selectedZones.size > 0 && (
              <div className="flex gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm flex-1"
                >
                  <option value="">Select action ({selectedZones.size} selected)...</option>
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
            <div className="text-center py-8">Loading zones...</div>
          ) : zones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No zones found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 text-left"><input type="checkbox" onChange={(e) => setSelectedZones(e.target.checked ? new Set(zones.map(z => String(z._id))) : new Set())} /></th>
                    <th className="p-2 text-left">Key</th>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Priority</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z._id} className="border-b hover:bg-gray-50">
                      <td className="p-2"><input type="checkbox" checked={selectedZones.has(String(z._id))} onChange={() => toggleZone(String(z._id))} /></td>
                      <td className="p-2 font-mono font-semibold">{z.key}</td>
                      <td className="p-2">{z.title || '—'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${z.status === 'enabled' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                          {z.status}
                        </span>
                      </td>
                      <td className="p-2">{z.priority || 0}</td>
                      <td className="p-2 space-x-1">
                        <Link href={`/admin/zones/${z._id}`} className="text-blue-600 hover:underline text-xs font-semibold">Edit</Link>
                        <button onClick={() => duplicate(z._id)} className="text-purple-600 hover:underline text-xs font-semibold">Copy</button>
                        <button onClick={() => deleteZone(z._id)} className="text-red-600 hover:underline text-xs font-semibold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
