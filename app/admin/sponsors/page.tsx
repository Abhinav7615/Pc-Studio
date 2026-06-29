'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminSponsorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') loadSponsors();
  }, [status]);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      let url = '/api/admin/sponsors';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      setSponsors(json.data || json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSponsor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, { method: 'DELETE' });
      if (res.ok) loadSponsors();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) loadSponsors();
    } catch (err) {
      console.error(err);
    }
  };

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-200 text-green-900';
      case 'pending_approval':
        return 'bg-yellow-200 text-yellow-900';
      case 'rejected':
        return 'bg-red-200 text-red-900';
      case 'paused':
        return 'bg-orange-200 text-orange-900';
      case 'expired':
        return 'bg-gray-200 text-gray-900';
      default:
        return 'bg-blue-200 text-blue-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Direct Sponsorships</h1>
            <p className="text-gray-700">Manage direct advertiser sponsorships and contracts</p>
          </div>
          <Link href="/admin/sponsors/create" className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
            ➕ New Sponsor
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search sponsors, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={loadSponsors} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold">
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          {loading ? (
            <div className="text-center py-8">Loading sponsors...</div>
          ) : sponsors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No sponsors found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 text-left">Company</th>
                    <th className="p-2 text-left">Contact</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Payment</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Period</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors.map((s) => (
                    <tr key={s._id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-semibold">{s.companyName}</td>
                      <td className="p-2">
                        <div className="text-xs">
                          <div>{s.advertiserName}</div>
                          <div className="text-gray-600">{s.email}</div>
                        </div>
                      </td>
                      <td className="p-2 font-bold">${s.amount}</td>
                      <td className="p-2">
                        <div className="text-xs">
                          <div className={s.paymentStatus === 'completed' ? 'text-green-600 font-bold' : 'text-yellow-600'}>
                            {s.paymentStatus}
                          </div>
                          <div className="text-gray-600">${s.paidAmount} / ${s.amount}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <select
                          value={s.status}
                          onChange={(e) => updateStatus(s._id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-bold border-0 cursor-pointer ${getStatusColor(s.status)}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="pending_approval">Pending</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="expired">Expired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="p-2 text-xs">
                        {new Date(s.startDate).toLocaleDateString()} —{' '}
                        {new Date(s.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-2 space-x-1">
                        <Link href={`/admin/sponsors/${s._id}`} className="text-blue-600 hover:underline text-xs font-semibold">
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteSponsor(s._id)}
                          className="text-red-600 hover:underline text-xs font-semibold"
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

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/sponsors/invoices" className="p-4 bg-white rounded-lg shadow hover:shadow-lg border-2 border-gray-200">
            <p className="font-bold text-lg text-gray-900">📄 Invoices</p>
            <p className="text-sm text-gray-700">Generate and manage sponsor invoices</p>
          </Link>
          <Link href="/admin/sponsors/analytics" className="p-4 bg-white rounded-lg shadow hover:shadow-lg border-2 border-gray-200">
            <p className="font-bold text-lg text-gray-900">📊 Analytics</p>
            <p className="text-sm text-gray-700">Sponsor campaign performance and ROI</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
