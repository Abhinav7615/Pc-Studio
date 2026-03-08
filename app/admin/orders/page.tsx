'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  _id: string;
  customer: { name: string; email: string; mobile: string };
  total: number;
  status: string;
  returnStatus: string;
  refundStatus: string;
  returnReason?: string;
  transactionId?: string;
  paymentScreenshot?: string;
  products: { product: { _id: string; name: string; price: number }; quantity: number }[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => {
    const loadOrders = async () => {
      await fetchOrders();
    };
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  const updateReturnStatus = async (id: string, returnStatus: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnStatus }),
    });
    fetchOrders();
  };

  const updateRefundStatus = async (id: string, refundStatus: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refundStatus }),
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
            <th className="border px-4 py-2">Products</th>
            <th className="border px-4 py-2">Total</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Return Status</th>
            <th className="border px-4 py-2">Refund Status</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td className="border px-4 py-2">
                {o.customer.name} ({o.customer.email})
              </td>
              <td className="border px-4 py-2">
                {o.products.map((item, idx) => (
                  <div key={`${o._id}-${item.product._id}-${idx}`}>{item.product.name} x{item.quantity}</div>
                ))}
              </td>
              <td className="border px-4 py-2">₹{o.total.toFixed(2)}</td>
              <td className="border px-4 py-2">{o.status}</td>
              <td className="border px-4 py-2">
                <select
                  value={o.returnStatus}
                  onChange={(e) => updateReturnStatus(o._id, e.target.value)}
                  className="border p-1 rounded text-sm"
                >
                  <option value="No Return">No Return</option>
                  <option value="Return Requested">Return Requested</option>
                  <option value="Return Approved">Return Approved</option>
                  <option value="Return Rejected">Return Rejected</option>
                  <option value="Return Received">Return Received</option>
                  <option value="Refund Processed">Refund Processed</option>
                </select>
                {o.returnReason && (
                  <div className="text-xs text-gray-600 mt-1">
                    Reason: {o.returnReason}
                  </div>
                )}
              </td>
              <td className="border px-4 py-2">
                <select
                  value={o.refundStatus}
                  onChange={(e) => updateRefundStatus(o._id, e.target.value)}
                  className="border p-1 rounded text-sm"
                >
                  <option value="No Refund">No Refund</option>
                  <option value="Refund Pending">Refund Pending</option>
                  <option value="Refund Approved">Refund Approved</option>
                  <option value="Refund Rejected">Refund Rejected</option>
                  <option value="Refund Processed">Refund Processed</option>
                </select>
              </td>
              <td className="border px-4 py-2 space-y-2">
                {o.paymentScreenshot ? (
                  <div>
                    <img src={o.paymentScreenshot} alt="payment" className="max-h-24 cursor-pointer" onClick={() => openImage(o.paymentScreenshot)} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No payment proof</div>
                )}
                <div className="space-x-2 mt-2">
                  <button onClick={() => updateStatus(o._id, 'Payment Verified')} className="px-2 py-1 bg-green-600 text-white rounded">Verify Payment</button>
                  <button onClick={() => updateStatus(o._id, 'Payment Pending')} className="px-2 py-1 bg-yellow-500 text-white rounded">Request Payment</button>
                  <button onClick={() => updateStatus(o._id, 'Payment Rejected')} className="px-2 py-1 bg-red-600 text-white rounded">Reject Payment</button>
                  <button onClick={() => updateStatus(o._id, 'Order Rejected')} className="px-2 py-1 bg-red-800 text-white rounded">Reject Order</button>
                  <button onClick={() => updateStatus(o._id, 'Order Preparing')} className="px-2 py-1 bg-blue-600 text-white rounded">Preparing</button>
                  <button onClick={() => updateStatus(o._id, 'Shipped')} className="px-2 py-1 bg-purple-600 text-white rounded">Shipped</button>
                  <button onClick={() => updateStatus(o._id, 'Delivered')} className="px-2 py-1 bg-green-800 text-white rounded">Delivered</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}