'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CouponData {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expirationDays?: number;
  expirationHours?: number;
  startHour?: number;
  endHour?: number;
  usageLimit?: number;
  usedCount?: number;
  type?: 'admin' | 'referral';
  user?: { _id: string; name: string; email: string };
}

export default function AdminCoupons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'referral'>('all');
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expirationDays: '',
    expirationHours: '',
    startHour: '',
    endHour: '',
    usageLimit: '',
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async () => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          discountValue: parseFloat(form.discountValue),
          expirationDays: form.expirationDays ? parseInt(form.expirationDays) : null,
          expirationHours: form.expirationHours ? parseInt(form.expirationHours) : null,
          startHour: form.startHour ? parseInt(form.startHour) : null,
          endHour: form.endHour ? parseInt(form.endHour) : null,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        }),
      });
      if (res.ok) {
        setForm({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          expirationDays: '',
          expirationHours: '',
          startHour: '',
          endHour: '',
          usageLimit: '',
        });
        fetchCoupons();
      } else {
        alert('Failed to create coupon');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Failed to create coupon');
    }
  };

  const updateCoupon = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/coupons?id=${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          discountValue: parseFloat(form.discountValue),
          expirationDays: form.expirationDays ? parseInt(form.expirationDays) : null,
          expirationHours: form.expirationHours ? parseInt(form.expirationHours) : null,
          startHour: form.startHour ? parseInt(form.startHour) : null,
          endHour: form.endHour ? parseInt(form.endHour) : null,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        }),
      });
      if (res.ok) {
        setForm({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          expirationDays: '',
          expirationHours: '',
          startHour: '',
          endHour: '',
          usageLimit: '',
        });
        setEditingId(null);
        fetchCoupons();
      } else {
        alert('Failed to update coupon');
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      alert('Failed to update coupon');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const blockCoupon = async (id: string) => {
    try {
      const coupon = coupons.find(c => c._id === id);
      if (!coupon) return;

      const res = await fetch(`/api/coupons?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          usageLimit: 0,
          expirationDays: coupon.expirationDays,
        }),
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Failed to block coupon');
      }
    } catch (error) {
      console.error('Error blocking coupon:', error);
      alert('Failed to block coupon');
    }
  };

  const startEdit = (coupon: CouponData) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      expirationDays: coupon.expirationDays?.toString() || '',
      expirationHours: coupon.expirationHours?.toString() || '',
      startHour: coupon.startHour?.toString() || '',
      endHour: coupon.endHour?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      expirationDays: '',
      expirationHours: '',
      startHour: '',
      endHour: '',
      usageLimit: '',
    });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchCoupons();
    }
  }, [status, session]);

  const filteredCoupons = coupons.filter(coupon => {
    if (filterType === 'admin') return (coupon.type || 'admin') === 'admin';
    if (filterType === 'referral') return coupon.type === 'referral';
    return true;
  });

  const adminCount = coupons.filter(c => (c.type || 'admin') === 'admin').length;
  const referralCount = coupons.filter(c => c.type === 'referral').length;

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Coupon Management</h1>
      <p className="text-gray-600 mb-8">Manage coupons and view referral assignments</p>

      <div className="mb-6 flex gap-3 flex-wrap">
        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded font-semibold transition ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
          All ({coupons.length})
        </button>
        <button onClick={() => setFilterType('admin')} className={`px-4 py-2 rounded font-semibold transition ${filterType === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
          Admin ({adminCount})
        </button>
        <button onClick={() => setFilterType('referral')} className={`px-4 py-2 rounded font-semibold transition ${filterType === 'referral' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
          Referral ({referralCount})
        </button>
      </div>

      {filterType === 'admin' && (
        <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-md border border-indigo-200">
          <h2 className="text-xl font-bold mb-4 text-indigo-900">{editingId ? '✏️ Edit Coupon' : '➕ Create New Coupon'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="border-2 border-indigo-300 p-3 rounded bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
            <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value as any })} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200">
              <option value="percentage">% Discount</option>
              <option value="fixed">₹ Fixed</option>
            </select>
            <input type="number" placeholder="Value" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
            <input type="number" placeholder="Days Valid" value={form.expirationDays} onChange={e => setForm({ ...form, expirationDays: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <input type="number" placeholder="Usage Limit" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
            <input type="number" placeholder="Start Hour (0-23)" value={form.startHour} onChange={e => setForm({ ...form, startHour: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
            <input type="number" placeholder="End Hour (0-23)" value={form.endHour} onChange={e => setForm({ ...form, endHour: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={editingId ? updateCoupon : createCoupon} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold transition shadow-md">
              {editingId ? 'Update Coupon' : 'Create Coupon'}
            </button>
            {editingId && <button onClick={cancelEdit} className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold transition shadow-md">Cancel</button>}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto border border-gray-200">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 border-b-2 border-indigo-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-white">Code</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Discount</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Used / Limit</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Valid Days</th>
              {filterType === 'referral' && <th className="px-4 py-3 text-left font-semibold text-white">Assigned To</th>}
              <th className="px-4 py-3 text-left font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={filterType === 'referral' ? 7 : 6} className="px-4 py-8 text-center text-gray-500">No coupons found</td>
              </tr>
            ) : (
              filteredCoupons.map(coupon => (
                <tr key={coupon._id} className="border-b border-gray-200 hover:bg-indigo-50 transition">
                  <td className="px-4 py-3 font-bold text-indigo-600">{coupon.code}</td>
                  <td className="px-4 py-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${(coupon.type || 'admin') === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{(coupon.type || 'admin') === 'admin' ? 'Admin' : 'Referral'}</span></td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                  <td className="px-4 py-3 text-gray-700">{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</td>
                  <td className="px-4 py-3 text-gray-700">{coupon.expirationDays || '∞'}</td>
                  {filterType === 'referral' && (
                    <td className="px-4 py-3 text-sm">
                      {coupon.user ? <div><span className="font-semibold text-gray-900">{coupon.user.name}</span><br/><span className="text-gray-600 text-xs">{coupon.user.email}</span></div> : <span className="text-gray-500">-</span>}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(coupon.type || 'admin') === 'admin' && (
                        <>
                          <button onClick={() => startEdit(coupon)} className="px-3 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 font-semibold transition shadow">Edit</button>
                          <button onClick={() => deleteCoupon(coupon._id)} className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 font-semibold transition shadow">Delete</button>
                        </>
                      )}
                      {coupon.type === 'referral' && (
                        <button onClick={() => blockCoupon(coupon._id)} disabled={coupon.usageLimit === 0} className={`px-3 py-1 text-white text-xs rounded font-semibold transition shadow ${coupon.usageLimit === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>
                          {coupon.usageLimit === 0 ? 'Blocked' : 'Block'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}