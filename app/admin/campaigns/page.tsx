'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminCampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') loadCampaigns();
  }, [status]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/campaigns');
      if (!res.ok) return;
      let data = await res.json();
      if (search) {
        const s = search.toLowerCase();
        data = data.filter((c: any) => c.name?.toLowerCase().includes(s));
      }
      setCampaigns(data);
      setSelectedCampaigns(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = (id: string) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCampaigns(newSelected);
  };

  const doBulkAction = async () => {
    if (!bulkAction || selectedCampaigns.size === 0) return;
    try {
      const res = await fetch('/api/admin/campaigns/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          ids: Array.from(selectedCampaigns),
        }),
      });
      if (res.ok) {
        loadCampaigns();
        setBulkAction('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const duplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/duplicate`, { method: 'POST' });
      if (res.ok) loadCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) loadCampaigns();
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
            <h1 className="text-3xl font-bold text-gray-900">Ad Campaigns</h1>
            <p className="text-gray-700">Manage advertising campaigns with budgets and schedules</p>
          </div>
          <Link href="/admin/campaigns/create" className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
            ➕ Create Campaign
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={loadCampaigns}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
            >
              🔄 Refresh
            </button>
            {selectedCampaigns.size > 0 && (
              <div className="flex gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm flex-1"
                >
                  <option value="">Select action ({selectedCampaigns.size} selected)...</option>
                  <option value="enable">Activate</option>
                  <option value="disable">Pause</option>
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
            <div className="text-center py-8">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No campaigns found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 text-left"><input type="checkbox" onChange={(e) => setSelectedCampaigns(e.target.checked ? new Set(campaigns.map(c => String(c._id))) : new Set())} /></th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Zone</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Budget</th>
                    <th className="p-2 text-left">Period</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c._id} className="border-b hover:bg-gray-50">
                      <td className="p-2"><input type="checkbox" checked={selectedCampaigns.has(String(c._id))} onChange={() => toggleCampaign(String(c._id))} /></td>
                      <td className="p-2 font-semibold">{c.name}</td>
                      <td className="p-2">{c.zone || '—'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          c.status === 'active' ? 'bg-green-200 text-green-900' :
                          c.status === 'paused' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-gray-200 text-gray-900'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">${c.budget || 0}</td>
                      <td className="p-2 text-xs">
                        {c.startDate && new Date(c.startDate).toLocaleDateString()} — {c.endDate && new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-2 space-x-1">
                        <Link href={`/admin/campaigns/${c._id}`} className="text-blue-600 hover:underline text-xs font-semibold">Edit</Link>
                        <button onClick={() => duplicate(c._id)} className="text-purple-600 hover:underline text-xs font-semibold">Copy</button>
                        <button onClick={() => deleteCampaign(c._id)} className="text-red-600 hover:underline text-xs font-semibold">Delete</button>
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
