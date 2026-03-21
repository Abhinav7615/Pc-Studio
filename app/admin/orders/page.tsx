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
  shipping?: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    mobile: string;
  };
  products: { product: { _id: string; name: string; originalPrice: number; discountPercent: number } | null; quantity: number }[];
}

export default function AdminOrders() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const statusOptions = [
    'All',
    'Payment Pending',
    'Payment Completed',
    'Payment Verified',
    'Payment Rejected',
    'Order Preparing',
    'Shipped',
    'Delivered',
    'Order Rejected'
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verify session exists
      if (!session) {
        throw new Error('Not authenticated. Please log in.');
      }
      
      const res = await fetch('/api/orders', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch orders: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

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

  const updateStatus = async (id: string, status: string) => {
    try {
      console.log('updateStatus', id, status);
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error || `Failed to update status (${res.status})`;
        console.error('Order update failed:', message, data);
        alert(message);
        return;
      }
      const updatedOrder = await res.json();
      console.log('Order updated successfully:', updatedOrder);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status');
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

  // Filter orders based on selected status
  const filteredOrders = statusFilter === 'All' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Order Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h2>
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Order Management</h1>
      
      {/* Status Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <label className="block text-gray-900 font-semibold mb-3">🔍 Filter by Status:</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(stat => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                statusFilter === stat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-3">
          📊 Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> of <span className="font-bold text-gray-900">{orders.length}</span> orders
        </p>
      </div>
      
      {filteredOrders.length === 0 && !error ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">📦 No Orders</h2>
          <p className="text-blue-800">No orders found at the moment. Orders will appear here when customers place them.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto border border-gray-200">
          <table className="w-full table-auto">
            <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-white">Customer Info & Shipping</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Products</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Return Status</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Refund Status</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Cancellation Status</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o._id}>
                  <td className="border px-4 py-4 text-sm min-w-[280px] bg-white">
                    <div className="mb-3">
                      <p className="font-bold text-gray-900">Customer:</p>
                      {o.customer ? (
                        <>
                          <p className="text-gray-800 font-medium">{o.customer.name}</p>
                          <p className="text-gray-700">📧 {o.customer.email}</p>
                          <p className="text-gray-700">📱 {o.customer.mobile}</p>
                        </>
                      ) : (
                        <p className="text-sm text-red-600">Customer record unavailable</p>
                      )}
                    </div>
                    {o.shipping && (
                      <div className="border-t mt-2 pt-2">
                        <p className="font-bold text-gray-900">Shipping:</p>
                        <p className="text-gray-800 font-medium">{o.shipping.name}</p>
                        <p className="text-gray-700">{o.shipping.address}</p>
                        <p className="text-gray-700">{o.shipping.city}, {o.shipping.postalCode}</p>
                        <p className="text-gray-700">{o.shipping.country}</p>
                        <p className="text-gray-700">📧 {o.shipping.email}</p>
                        <p className="text-gray-700">📱 {o.shipping.mobile}</p>
                      </div>
                    )}
                  </td>
                  <td className="border px-4 py-2 bg-white">
                    {o.products.map((item, idx) => (
                      <div key={`${o._id}-${item.product?._id || 'deleted'}-${idx}`} className="text-gray-900 font-semibold mb-1">{item.product ? item.product.name : 'Deleted Product'} <span className="font-bold">x{item.quantity}</span></div>
                    ))}
                  </td>
                  <td className="border px-4 py-2 bg-white">
                    <p className="text-gray-900 font-bold text-lg">₹{o.total.toFixed(2)}</p>
                    {o.discountAmount > 0 && (
                      <div className="text-xs text-green-700 font-semibold mt-1">
                        Discount: ₹{o.discountAmount.toFixed(2)} {o.discountCoupon && `(Code: ${o.discountCoupon})`}
                      </div>
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    <span className={`px-3 py-2 rounded text-sm font-bold ${
                      o.status === 'Payment Pending' ? 'bg-gray-300 text-gray-900' :
                      o.status === 'Payment Completed' ? 'bg-yellow-300 text-gray-900' :
                      o.status === 'Payment Verified' ? 'bg-green-400 text-white' :
                      o.status === 'Payment Rejected' ? 'bg-red-500 text-white' :
                      o.status === 'Order Preparing' ? 'bg-blue-400 text-white' :
                      o.status === 'Shipped' ? 'bg-purple-400 text-white' :
                      o.status === 'Delivered' ? 'bg-green-500 text-white' :
                      o.status === 'Order Rejected' ? 'bg-red-600 text-white' :
                      'bg-gray-300 text-gray-900'
                    }`}>{o.status}</span>
                  </td>
                  <td className="border px-4 py-2">
                    <select
                      value={o.returnStatus}
                      onChange={(e) => updateReturnStatus(o._id, e.target.value)}
                      className="w-full border-2 border-orange-400 p-2 rounded text-sm font-semibold bg-white text-gray-900 focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-300"
                    >
                      <option value="No Return" className="text-gray-900">No Return</option>
                      <option value="Return Requested" className="text-orange-700">Return Requested</option>
                      <option value="Return Approved" className="text-green-700">Return Approved</option>
                      <option value="Return Rejected" className="text-red-700">Return Rejected</option>
                      <option value="Return Received" className="text-blue-700">Return Received</option>
                      <option value="Refund Processed" className="text-purple-700">Refund Processed</option>
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
                      className="w-full border-2 border-purple-400 p-2 rounded text-sm font-semibold bg-white text-gray-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300"
                    >
                      <option value="No Refund" className="text-gray-900">No Refund</option>
                      <option value="Refund Pending" className="text-yellow-700">Refund Pending</option>
                      <option value="Refund Approved" className="text-green-700">Refund Approved</option>
                      <option value="Refund Rejected" className="text-red-700">Refund Rejected</option>
                      <option value="Refund Processed" className="text-blue-700">Refund Processed</option>
                    </select>
                  </td>
                  <td className="border px-4 py-2">
                    <select
                      value={o.cancellationStatus}
                          onChange={(e) => updateCancellationStatus(o._id, e.target.value)}
                      className="w-full border-2 border-red-400 p-2 rounded text-sm font-semibold bg-white text-gray-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-300"
                    >
                      <option value="None" className="text-gray-900">None</option>
                      <option value="Cancellation Requested" className="text-orange-700">Cancellation Requested</option>
                      <option value="Cancellation Approved" className="text-green-700">Cancellation Approved</option>
                      <option value="Cancellation Rejected" className="text-red-700">Cancellation Rejected</option>
                    </select>
                    {o.cancellationReason && (
                      <div className="text-xs text-gray-700 font-medium mt-1">
                        Reason: {o.cancellationReason}
                      </div>
                    )}
                  </td>
                  <td className="border px-4 py-2 min-w-[220px]">
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
                          {(o.status !== 'Payment Verified' && o.status !== 'Payment Rejected') && (
                            <button onClick={() => updateStatus(o._id, 'Payment Verified')} className="min-w-[140px] px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded border border-blue-600 hover:bg-blue-600 transition shadow-sm">
                              ✅ Verify Payment
                            </button>
                          )}
                          {o.status !== 'Payment Pending' && o.status !== 'Payment Verified' && o.status !== 'Payment Rejected' && (
                            <button onClick={() => updateStatus(o._id, 'Payment Pending')} className="min-w-[140px] px-3 py-2 bg-yellow-200 text-gray-900 text-sm font-semibold rounded border border-yellow-400 hover:bg-yellow-300 transition shadow-sm">
                              ⚠ Request Payment
                            </button>
                          )}
                          {o.status !== 'Payment Rejected' && (
                            <button onClick={() => updateStatus(o._id, 'Payment Rejected')} className="min-w-[140px] px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded border border-red-600 hover:bg-red-600 transition shadow-sm">
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
      )}
    </div>
  );
}