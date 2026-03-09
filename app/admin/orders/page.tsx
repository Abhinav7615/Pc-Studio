'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OrderItem {
  _id: string;
  customer: { name: string; email: string; mobile: string };
  total: number;
  discountAmount: number;
  discountCoupon?: string;
  status: string;
  returnStatus: string;
  refundStatus: string;
  cancellationStatus: string;
  cancellationReason?: string;
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

  const updateCancellationStatus = async (id: string, cancellationStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update cancellation status');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error updating cancellation status:', error);
      alert('Failed to update cancellation status');
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cancelled/rejected order? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchOrders();
        alert('Order deleted successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
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
            <th className="border px-4 py-2">Cancellation Status</th>
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
              <td className="border px-4 py-2">
                ₹{o.total.toFixed(2)}
                {o.discountAmount > 0 && (
                  <div className="text-xs text-green-600">
                    Discount: ₹{o.discountAmount.toFixed(2)} {o.discountCoupon && `(Code: ${o.discountCoupon})`}
                  </div>
                )}
              </td>
                <td className="border px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm text-black ${
                    o.status === 'Payment Pending' ? 'bg-gray-100' :
                    o.status === 'Payment Completed' ? 'bg-yellow-100' :
                    o.status === 'Payment Verified' ? 'bg-green-100' :
                    o.status === 'Payment Rejected' ? 'bg-red-100' :
                    o.status === 'Order Preparing' ? 'bg-blue-100' :
                    o.status === 'Shipped' ? 'bg-purple-100' :
                    o.status === 'Delivered' ? 'bg-green-200' :
                    o.status === 'Order Rejected' ? 'bg-red-200' :
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
                  <div className="text-xs text-gray-700 font-medium mt-1">
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
              <td className="border px-4 py-2">
                <select
                  value={o.cancellationStatus}
                  onChange={(e) => updateCancellationStatus(o._id, e.target.value)}
                  className="border p-1 rounded text-sm"
                >
                  <option value="None">None</option>
                  <option value="Cancellation Requested">Cancellation Requested</option>
                  <option value="Cancellation Approved">Cancellation Approved</option>
                  <option value="Cancellation Rejected">Cancellation Rejected</option>
                </select>
                {o.cancellationReason && (
                  <div className="text-xs text-gray-700 font-medium mt-1">
                    Reason: {o.cancellationReason}
                  </div>
                )}
              </td>
              <td className="border px-4 py-2">
                <div className="space-y-3">
                  {/* Payment Proof */}
                  <div>
                    {o.paymentScreenshot ? (
                      <Image src={o.paymentScreenshot} alt="payment" width={96} height={96} className="max-h-20 cursor-pointer border rounded" onClick={() => openImage(o.paymentScreenshot)} />
                    ) : (
                      <div className="text-xs text-gray-700 font-medium">No payment proof</div>
                    )}
                  </div>

                  {/* Payment Actions */}
                  <div className="border-t pt-2">
                    <p className="text-xs font-semibold mb-1">💳 Payment Actions:</p>
                    <div className="flex flex-wrap gap-1">
                      {(o.status === 'Payment Pending' || o.status === 'Payment Completed') && (
                        <button onClick={() => updateStatus(o._id, 'Payment Verified')} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                          ✓ Approve Payment
                        </button>
                      )}
                      {o.status !== 'Payment Pending' && (
                        <button onClick={() => updateStatus(o._id, 'Payment Pending')} className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600">
                          ⚠ Request Payment
                        </button>
                      )}
                      {o.status !== 'Payment Rejected' && (
                        <button onClick={() => updateStatus(o._id, 'Payment Rejected')} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                          ✗ Reject Payment
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="border-t pt-2">
                    <p className="text-xs font-semibold mb-1">📦 Order Actions:</p>
                    <div className="flex flex-wrap gap-1">
                      {o.status === 'Payment Verified' && (
                        <button onClick={() => updateStatus(o._id, 'Order Preparing')} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-semibold">
                          ✓ Confirm Order
                        </button>
                      )}
                      {o.status === 'Order Preparing' && (
                        <button onClick={() => updateStatus(o._id, 'Shipped')} className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700">
                          📤 Ship Order
                        </button>
                      )}
                      {o.status === 'Shipped' && (
                        <button onClick={() => updateStatus(o._id, 'Delivered')} className="px-2 py-1 bg-green-700 text-white text-xs rounded hover:bg-green-800">
                          ✓ Mark Delivered
                        </button>
                      )}
                      {(o.status !== 'Order Rejected' && o.status !== 'Delivered') && (
                        <button onClick={() => updateStatus(o._id, 'Order Rejected')} className="px-2 py-1 bg-red-800 text-white text-xs rounded hover:bg-red-900">
                          ✗ Reject Order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delete Action for Cancelled/Rejected Orders */}
                  {(o.status === 'Order Rejected' || o.cancellationStatus === 'Cancellation Approved') && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-semibold mb-1 text-red-600">🗑️ Delete Order:</p>
                      <button
                        onClick={() => deleteOrder(o._id)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-semibold"
                      >
                        🗑️ Delete Order
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}