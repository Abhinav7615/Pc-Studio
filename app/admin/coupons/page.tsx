'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminCoupons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (status === 'loading' || loading) return <div className="p-8"><p>Loading...</p></div>;
  if (!session || session.user.role !== 'admin') return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Coupon Management</h1>

      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Create New Coupon</h2>
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
        <button
          onClick={createCoupon}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Coupon
        </button>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}