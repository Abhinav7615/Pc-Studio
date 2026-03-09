'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminCoupons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const startEdit = (coupon: any) => {
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

  if (status === 'loading' || loading) return <div className="p-8"><p>Loading...</p></div>;
  if (!session || session.user.role !== 'admin') return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Coupon Management</h1>

      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Coupon Code"
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="border p-2 rounded"
          />
          <select
            value={form.discountType}
            onChange={e => setForm({ ...form, discountType: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="percentage">Percentage Discount</option>
            <option value="fixed">Fixed Amount Discount</option>
          </select>
          <input
            type="number"
            placeholder="Discount Value"
            value={form.discountValue}
            onChange={e => setForm({ ...form, discountValue: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Expiration Days (optional)"
            value={form.expirationDays}
            onChange={e => setForm({ ...form, expirationDays: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Expiration Hours (optional)"
            value={form.expirationHours}
            onChange={e => setForm({ ...form, expirationHours: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Start Hour (0-23, optional)"
            value={form.startHour}
            onChange={e => setForm({ ...form, startHour: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="End Hour (0-23, optional)"
            value={form.endHour}
            onChange={e => setForm({ ...form, endHour: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Usage Limit (optional)"
            value={form.usageLimit}
            onChange={e => setForm({ ...form, usageLimit: e.target.value })}
            className="border p-2 rounded"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={editingId ? updateCoupon : createCoupon}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {editingId ? 'Update Coupon' : 'Create Coupon'}
          </button>
          {editingId && (
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Existing Coupons</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Code</th>
            <th className="border px-4 py-2">Type</th>
            <th className="border px-4 py-2">Value</th>
            <th className="border px-4 py-2">Used</th>
            <th className="border px-4 py-2">Limit</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map(coupon => (
            <tr key={coupon._id}>
              <td className="border px-4 py-2">{coupon.code}</td>
              <td className="border px-4 py-2">{coupon.discountType}</td>
              <td className="border px-4 py-2">{coupon.discountValue}</td>
              <td className="border px-4 py-2">{coupon.usedCount}</td>
              <td className="border px-4 py-2">{coupon.usageLimit || 'Unlimited'}</td>
              <td className="border px-4 py-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(coupon)}
                    className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCoupon(coupon._id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}