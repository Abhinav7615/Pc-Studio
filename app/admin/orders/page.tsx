'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
  products: { product: { _id: string; name: string; originalPrice: number; discountPercent: number } | null; quantity: number }[];
}

export default function AdminOrders() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user?.role === 'admin' || session?.user?.role === 'staff')) {
      fetchOrders();
    }
  }, [status, session]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const updateReturnStatus = async (id: string, returnStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update return status');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error updating return status:', error);
      alert('Failed to update return status');
    }
  };

  const updateRefundStatus = async (id: string, refundStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update refund status');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error updating refund status:', error);
      alert('Failed to update refund status');
    }
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
                  <div key={`${o._id}-${item.product?._id || 'deleted'}-${idx}`}>{item.product ? item.product.name : 'Deleted Product'} x{item.quantity}</div>
                ))}
              </td>
              <td className="border px-4 py-2">₹{o.total.toFixed(2)}</td>
                <td className="border px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    o.status === 'Payment Pending' ? 'bg-gray-100' :
                    o.status === 'Payment Completed' ? 'bg-yellow-100 text-yellow-800' :
                    o.status === 'Payment Verified' ? 'bg-green-100 text-green-800' :
                    o.status === 'Payment Rejected' ? 'bg-red-100 text-red-800' :
                    o.status === 'Order Preparing' ? 'bg-blue-100 text-blue-800' :
                    o.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                    o.status === 'Delivered' ? 'bg-green-200 text-green-900' :
                    o.status === 'Order Rejected' ? 'bg-red-200 text-red-900' :
                    'bg-gray-100'
                  }`}>{o.status}</span>
                </td>
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
                    <Image src={o.paymentScreenshot} alt="payment" width={96} height={96} className="max-h-24 cursor-pointer" onClick={() => openImage(o.paymentScreenshot)} />
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