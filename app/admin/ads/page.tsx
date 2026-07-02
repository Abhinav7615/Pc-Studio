'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({ status: 'all', zone: 'all', search: '' });
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') loadAds();
  }, [status, filter]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ads');
      if (!res.ok) return;
      let data = await res.json();
      
      // Apply filters
      if (filter.status !== 'all') {
        data = data.filter((ad: any) => ad.status === filter.status);
      }
      if (filter.zone !== 'all') {
        data = data.filter((ad: any) => ad.zone === filter.zone);
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        data = data.filter((ad: any) => ad.title?.toLowerCase().includes(search));
      }
      
      setAds(data);
      setSelectedAds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAd = (id: string) => {
    const newSelected = new Set(selectedAds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAds(newSelected);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(new Set(ads.map(a => String(a._id))));
    } else {
      setSelectedAds(new Set());
    }
  };

  const doBulkAction = async () => {
    if (!bulkAction || selectedAds.size === 0) return;
    try {
      const res = await fetch('/api/admin/ads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          ids: Array.from(selectedAds),
        }),
      });
      if (res.ok) {
        loadAds();
        setBulkAction('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const duplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ads/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        loadAds();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAds();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const zones = [...new Set(ads.map((a: any) => a.zone))];
  const ctr = (ad: any) => ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0';

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Advertisement Management</h1>
          <p className="text-gray-700">Manage banners, campaigns, and ad zones</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Link href="/admin/ads/create" className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-center">
            ➕ Create Ad
          </Link>
          <Link href="/admin/providers" className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold text-center">
            🔌 Providers
          </Link>
          <Link href="/admin/zones" className="px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold text-center">
            📍 Zones
          </Link>
          <Link href="/admin/campaigns" className="px-4 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 font-semibold text-center">
            📊 Campaigns
          </Link>
          <Link href="/admin/billing/invoices" className="px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 font-semibold text-center">
            💰 Billing
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search ads..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="disabled">Disabled</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={filter.zone}
              onChange={(e) => setFilter({ ...filter, zone: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Zones</option>
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <button
              onClick={loadAds}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
            >
              🔄 Refresh
            </button>
          </div>

          {selectedAds.size > 0 && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded flex items-center justify-between">
              <span className="font-semibold">{selectedAds.size} ad(s) selected</span>
              <div className="flex gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">Select action...</option>
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
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading ads...</div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No ads found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAds.size === ads.length && ads.length > 0}
                        onChange={(e) => toggleAll(e.target.checked)}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Zone</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Impr.</th>
                    <th className="p-2 text-right">Clicks</th>
                    <th className="p-2 text-right">CTR</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedAds.has(String(ad._id))}
                          onChange={() => toggleAd(String(ad._id))}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="p-2 font-semibold">{ad.title || '—'}</td>
                      <td className="p-2">{ad.zone}</td>
                      <td className="p-2">{ad.type}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          ad.status === 'active' ? 'bg-green-200 text-green-900' :
                          ad.status === 'draft' ? 'bg-yellow-200 text-yellow-900' :
                          ad.status === 'disabled' ? 'bg-red-200 text-red-900' :
                          'bg-gray-200 text-gray-900'
                        }`}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">{ad.impressions || 0}</td>
                      <td className="p-2 text-right">{ad.clicks || 0}</td>
                      <td className="p-2 text-right font-semibold">{ctr(ad)}%</td>
                      <td className="p-2 text-right space-x-1">
                        <Link href={`/admin/ads/${ad._id}`} className="text-blue-600 hover:underline text-xs font-semibold">
                          Edit
                        </Link>
                        <button
                          onClick={() => duplicate(ad._id)}
                          className="text-purple-600 hover:underline text-xs font-semibold"
                          title="Duplicate this ad"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => deleteAd(ad._id)}
                          className="text-red-600 hover:underline text-xs font-semibold"
                          title="Delete this ad"
                        >
                          Delete
                        </button>
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
