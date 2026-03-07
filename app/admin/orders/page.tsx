'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  _id: string;
  customer: { name: string; email: string; mobile: string };
  total: number;
  status: string;
  transactionId?: string;
  paymentScreenshot?: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  const openImage = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Order Management</h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Customer</th>
            <th className="border px-4 py-2">Total</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td className="border px-4 py-2">
                {o.customer.name} ({o.customer.email})
              </td>
              <td className="border px-4 py-2">₹{o.total.toFixed(2)}</td>
              <td className="border px-4 py-2">{o.status}</td>
              <td className="border px-4 py-2 space-y-2">
                {o.paymentScreenshot ? (
                  <div>
                    <img src={o.paymentScreenshot} alt="payment" className="max-h-24 cursor-pointer" onClick={() => openImage(o.paymentScreenshot)} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No payment proof</div>
                )}
                <div className="space-x-2 mt-2">
                  <button onClick={() => updateStatus(o._id, 'Payment Verified')} className="px-2 py-1 bg-green-600 text-white rounded">Verify</button>
                  <button onClick={() => updateStatus(o._id, 'Payment Pending')} className="px-2 py-1 bg-yellow-500 text-white rounded">Request Payment</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}