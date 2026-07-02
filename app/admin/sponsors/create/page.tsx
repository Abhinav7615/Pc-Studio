'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminSponsorCreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sponsorId = params?.id as string;

  const [loading, setLoading] = useState(!!sponsorId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    advertiserName: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    logo: '',
    banner: '',
    video: '',
    html: '',
    landingUrl: '',
    adZones: [] as string[],
    startDate: '',
    endDate: '',
    amount: 0,
    invoiceNumber: '',
    paymentStatus: 'pending' as any,
    paidAmount: 0,
    currency: 'INR',
    adType: 'banner' as any,
    adTitle: '',
    adDescription: '',
    priority: 10,
    status: 'draft' as any,
    frequencyCap: 0,
    dailyBudget: 0,
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (sponsorId && status === 'authenticated') {
      fetch(`/api/admin/sponsors/${sponsorId}`)
        .then((r) => r.json())
        .then((data) => {
          setForm(data);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, [sponsorId, status]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setSaving(true);
      const method = sponsorId ? 'PUT' : 'POST';
      const url = sponsorId ? `/api/admin/sponsors/${sponsorId}` : '/api/admin/sponsors';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push('/admin/sponsors');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {sponsorId ? 'Edit Sponsor' : 'Create New Sponsor'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          {/* Company Information */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Advertiser Name *</label>
                <input
                  type="text"
                  name="advertiserName"
                  value={form.advertiserName}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Ad Configuration */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Ad Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ad Type *</label>
                <select
                  name="adType"
                  value={form.adType}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="banner">Banner</option>
                  <option value="html">HTML</option>
                  <option value="video">Video</option>
                  <option value="native">Native</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                <input
                  type="number"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ad Title</label>
                <input
                  type="text"
                  name="adTitle"
                  value={form.adTitle}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Landing URL</label>
                <input
                  type="url"
                  name="landingUrl"
                  value={form.landingUrl}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ad Description</label>
                <textarea
                  name="adDescription"
                  value={form.adDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Billing Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Paid Amount</label>
                <input
                  type="number"
                  name="paidAmount"
                  value={form.paidAmount}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Status</label>
                <select
                  name="paymentStatus"
                  value={form.paymentStatus}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="completed">Completed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={form.invoiceNumber}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Campaign Dates */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Campaign Period</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
            >
              {saving ? 'Saving...' : sponsorId ? 'Update Sponsor' : 'Create Sponsor'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
