'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface OrderItem {
  _id: string;
  customer: { name: string; email: string; mobile: string; customerId?: string };
  total: number;
  discountAmount: number;
  discountCoupon?: string;
  discountBreakdown?: {
    manualCoupon: number;
    referralDiscount: number;
    firstOrderDiscount: number;
  };
  shippingCharges?: number;
  shippingState?: string;
  status: string;
  returnStatus: string;
  refundStatus: string;
  cancellationStatus: string;
  cancellationReason?: string;
  returnReason?: string;
  transactionId?: string;
  paymentScreenshot?: string;
  createdAt: string;
  deliveryCompanyName?: string;
  deliveryCompanyDetails?: string;
  trackingId?: string;
  shipping?: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    mobile: string;
  };
  products: { product: { _id: string; name: string } | null; quantity: number; price: number; gstPercent: number; discountPercent: number }[];
}

export default function AdminOrders() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [settings, setSettings] = useState<{ paymentVerificationStartTime?: string; paymentVerificationEndTime?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFilterEnabled, setDateFilterEnabled] = useState(true);
  const [cleanupThreshold, setCleanupThreshold] = useState(6);
  const [cleanupUnit, setCleanupUnit] = useState<'months' | 'years'>('months');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [deliveryEditOrderId, setDeliveryEditOrderId] = useState<string | null>(null);
  const [deliveryCompanyName, setDeliveryCompanyName] = useState('');
  const [deliveryCompanyDetails, setDeliveryCompanyDetails] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const isAdmin = session?.user?.role === 'admin';

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

  const fetchOrders = useCallback(async () => {
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
  }, [session]);

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
  }, [status, session, fetchOrders]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/business-settings');
        if (!res.ok) return;
        const data = await res.json();
        setSettings({
          paymentVerificationStartTime: data.paymentVerificationStartTime || '09:00',
          paymentVerificationEndTime: data.paymentVerificationEndTime || '17:00',
        });
      } catch (err) {
        console.error('Failed to load business settings', err);
      }
    };
    fetchSettings();
  }, []);

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

  const cleanupOldOrders = async () => {
    if (!confirm(`This will permanently delete all orders older than ${cleanupThreshold} ${cleanupUnit}. Continue?`)) {
      return;
    }

    setCleanupLoading(true);
    try {
      const res = await fetch('/api/orders/cleanup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholdValue: cleanupThreshold, thresholdUnit: cleanupUnit }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete old orders');
      }

      fetchOrders();
      alert(`Deleted ${data.deletedCount || 0} orders older than ${cleanupThreshold} ${cleanupUnit}.`);
    } catch (error) {
      console.error('Order cleanup failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete old orders');
    } finally {
      setCleanupLoading(false);
    }
  };

  const getVerificationTimeSlotString = () => {
    try {
      const startTime = settings.paymentVerificationStartTime || '09:00';
      const endTime = settings.paymentVerificationEndTime || '17:00';
      return `${startTime} to ${endTime}`;
    } catch (_e) {
      return '09:00 to 17:00';
    }
  };

  const openImage = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  // Filter orders based on selected status, dates and search term
  const filteredOrdersByStatus = statusFilter === 'All' ? orders : orders.filter(order => order.status === statusFilter);

  const filteredOrdersByDate = dateFilterEnabled
    ? filteredOrdersByStatus.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      })
    : filteredOrdersByStatus;

  const filteredOrders = filteredOrdersByDate.filter(order => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      order._id.toLowerCase().includes(q) ||
      order.customer?.name?.toLowerCase().includes(q) ||
      order.customer?.email?.toLowerCase().includes(q) ||
      order.customer?.mobile?.toLowerCase().includes(q) ||
      order.customer?.customerId?.toLowerCase().includes(q)
    );
  });

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalCancelled = filteredOrders.filter(order => order.status === 'Order Rejected' || order.cancellationStatus === 'Cancellation Approved').length;
  const totalRejected = filteredOrders.filter(order => order.status === 'Payment Rejected').length;
  const totalPaymentVerified = filteredOrders.filter(order => order.status === 'Payment Verified').length;


  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading orders...</div>;
  }

  const startDeliveryEdit = (order: OrderItem) => {
    setDeliveryEditOrderId(order._id);
    setDeliveryCompanyName(order.deliveryCompanyName || '');
    setDeliveryCompanyDetails(order.deliveryCompanyDetails || '');
    setTrackingId(order.trackingId || '');
  };

  const cancelDeliveryEdit = () => {
    setDeliveryEditOrderId(null);
    setDeliveryCompanyName('');
    setDeliveryCompanyDetails('');
    setTrackingId('');
  };

  const saveDeliveryDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryCompanyName, deliveryCompanyDetails, trackingId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save delivery details');
      }
      setDeliveryEditOrderId(null);
      setDeliveryCompanyName('');
      setDeliveryCompanyDetails('');
      setTrackingId('');
      fetchOrders();
      alert('Delivery details saved successfully');
    } catch (error) {
      console.error('Save delivery details failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to save delivery details');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Order Management (ऑर्डर प्रबंधन)</h1>
      
      {/* Status and Date Filter + Daily Revenue Section */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-900 font-semibold mb-2">🔍 Filter by Status (स्थिति के अनुसार फ़िल्टर):</label>
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
          </div>

          <div>
            <label className="block text-gray-900 font-semibold mb-2">📅 Date Range (तारीख सीमा):</label>
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <label className="inline-flex items-center gap-2 text-gray-900 font-medium">
                <input
                  type="checkbox"
                  checked={dateFilterEnabled}
                  onChange={(e) => setDateFilterEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600"
                />
                Enable Date Filter
              </label>
              <span className="text-sm text-gray-600">
                {dateFilterEnabled ? 'Showing orders within selected date range.' : 'Date range disabled — showing all orders.'}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={!dateFilterEnabled}
                className={`border rounded-lg px-3 py-2 ${dateFilterEnabled ? 'border-gray-300' : 'border-gray-200 bg-gray-100 text-gray-500'}`}
              />
              <span className="self-center text-gray-600">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={!dateFilterEnabled}
                className={`border rounded-lg px-3 py-2 ${dateFilterEnabled ? 'border-gray-300' : 'border-gray-200 bg-gray-100 text-gray-500'}`}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-gray-900 font-semibold mb-2">🔎 Search (खोज):</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID, customer name/email/mobile/customer ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🧹 Delete Old Orders</h3>
          <p className="text-sm text-gray-600 mb-4">Select how old orders must be before they are permanently deleted. This helps keep your order database clean.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Delete orders older than</label>
              <input
                type="number"
                min={1}
                value={cleanupThreshold}
                onChange={(e) => setCleanupThreshold(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Time unit</label>
              <select
                value={cleanupUnit}
                onChange={(e) => setCleanupUnit(e.target.value as 'months' | 'years')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
            <div>
              <button
                onClick={cleanupOldOrders}
                disabled={cleanupLoading || !isAdmin}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {cleanupLoading ? 'Deleting...' : 'Delete Old Orders'}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Note: This permanently deletes orders older than the selected threshold.</p>
          {!isAdmin && (
            <p className="mt-2 text-xs text-red-600">Only admin users can execute this cleanup.</p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg">
            <p className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">Orders</p>
            <p className="text-2xl font-bold text-indigo-900">{totalOrders}</p>
          </div>
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">Total Revenue</p>
            <p className="text-2xl font-bold text-green-900">₹{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-xs uppercase tracking-wide text-orange-700 font-semibold">Payment Verified</p>
            <p className="text-2xl font-bold text-orange-900">{totalPaymentVerified}</p>
          </div>
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-xs uppercase tracking-wide text-red-700 font-semibold">Cancelled/Rejected</p>
            <p className="text-2xl font-bold text-red-900">{totalCancelled + totalRejected}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-3">Showing {filteredOrders.length} filtered orders from {orders.length} total.</p>
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
                <React.Fragment key={o._id}>
                  <tr>
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
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      <div>Product subtotal: <span className="font-semibold">₹{o.products.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0).toFixed(2)}</span></div>
                      <div>GST: <span className="font-semibold">₹{o.products.reduce((sum, item) => sum + ((item.price || 0) * item.quantity * ((item.gstPercent || 0) / 100)), 0).toFixed(2)}</span></div>
                      <div>Shipping: <span className="font-semibold">₹{(o.shippingCharges || 0).toFixed(2)}</span>{o.shippingCharges === 0 ? ' (Free)' : ''}</div>
                    </div>
                    {(o.discountAmount > 0 || o.discountBreakdown) && (
                      <div className="text-xs text-red-700 font-semibold mt-2 space-y-0.5">
                        {o.discountBreakdown?.manualCoupon && o.discountBreakdown.manualCoupon > 0 && (
                          <div>Coupon Discount: -₹{o.discountBreakdown.manualCoupon.toFixed(2)} {o.discountCoupon && `(Code: ${o.discountCoupon})`}</div>
                        )}
                        {o.discountBreakdown?.referralDiscount && o.discountBreakdown.referralDiscount > 0 && (
                          <div>Referral Discount: -₹{o.discountBreakdown.referralDiscount.toFixed(2)}</div>
                        )}
                        {o.discountBreakdown?.firstOrderDiscount && o.discountBreakdown.firstOrderDiscount > 0 && (
                          <div>First Order Discount: -₹{o.discountBreakdown.firstOrderDiscount.toFixed(2)}</div>
                        )}
                        {!o.discountBreakdown && o.discountAmount > 0 && (
                          <div>Discount: -₹{o.discountAmount.toFixed(2)} {o.discountCoupon && `(Code: ${o.discountCoupon})`}</div>
                        )}
                      </div>
                    )}
                    {o.discountAmount === 0 && (
                      <div className="text-xs text-gray-700 font-medium mt-2">No discounts applied</div>
                    )}
                    <div className="text-xs text-gray-700 font-medium mt-2">
                      Total = Product subtotal + GST + Shipping - Discounts
                    </div>
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
                    }`}>
                      {o.status === 'Payment Completed'
                        ? 'Payment Completed (भुगतान पूरा, admin सत्यापन बाकी)' 
                        : o.status
                      }
                    </span>
                    {o.status === 'Payment Completed' && (
                      <div className="text-xs text-orange-800 font-medium mt-1">
                        Payment completed but not verified by admin yet.
                        <br /> भुगतान अभी admin द्वारा सत्यापित नहीं हुआ है।
                        {settings.paymentVerificationStartTime && (
                          <><br />Admin verifies payments: {getVerificationTimeSlotString()} (Admin set time slot)</>
                        )}
                      </div>
                    )}
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
                          <img
                            src={o.paymentScreenshot}
                            alt="payment"
                            className="max-h-20 cursor-pointer border rounded"
                            onClick={() => openImage(o.paymentScreenshot)}
                          />
                        ) : (
                          <div className="text-xs text-gray-700 font-medium">No payment proof</div>
                        )}
                      </div>

                      {/* Payment Actions */}
                      <div className="border-t pt-2">
                        <p className="text-xs font-semibold mb-1">💳 Payment Actions:</p>
                        <div className="flex flex-wrap gap-1">
                          {(o.status !== 'Payment Verified' && o.status !== 'Payment Rejected') && (
                            <button onClick={() => updateStatus(o._id, 'Payment Verified')} className="min-w-[140px] px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded border border-blue-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition shadow-sm">
                              ✅ Verify Payment
                            </button>
                          )}
                          {o.status !== 'Payment Pending' && o.status !== 'Payment Verified' && o.status !== 'Payment Rejected' && (
                            <button onClick={() => updateStatus(o._id, 'Payment Pending')} className="min-w-[140px] px-3 py-2 bg-orange-500 text-white text-sm font-semibold rounded border border-orange-600 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition shadow-sm">
                              ⚠ Request Payment
                            </button>
                          )}
                          {o.status !== 'Payment Rejected' && (
                            <button onClick={() => updateStatus(o._id, 'Payment Rejected')} className="min-w-[140px] px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded border border-red-700 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition shadow-sm">
                              ✗ Reject Payment
                            </button>
                          )}

                          {o.status === 'Payment Rejected' || o.status === 'Delivered' || o.status === 'Order Rejected' ? (
                            <span className="text-xs text-gray-700 font-medium italic">No payment actions available for final status.</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Order Actions */}
                      <div className="border-t pt-2">
                        <p className="text-xs font-semibold mb-1">📦 Order Actions:</p>
                        <div className="flex flex-wrap gap-1">
                          {o.status === 'Payment Verified' && (
                            <button onClick={() => updateStatus(o._id, 'Order Preparing')} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-semibold">
                              ✓ Confirm Order
                            </button>
                          )}
                          {o.status === 'Order Preparing' && (
                            <button onClick={() => updateStatus(o._id, 'Shipped')} className="px-2 py-1 bg-sky-600 text-white text-xs rounded hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 font-semibold">
                              📤 Ship Order
                            </button>
                          )}
                          {o.status === 'Shipped' && (
                            <button onClick={() => updateStatus(o._id, 'Delivered')} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 font-semibold">
                              ✓ Mark Delivered
                            </button>
                          )}
                          {(o.status !== 'Order Rejected' && o.status !== 'Delivered') && (
                            <button onClick={() => updateStatus(o._id, 'Order Rejected')} className="px-2 py-1 bg-rose-600 text-white text-xs rounded hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 font-semibold">
                              ✗ Reject Order
                            </button>
                          )}

                          {(o.status === 'Order Rejected' || o.status === 'Delivered') && (
                            <span className="text-xs text-gray-700 font-medium italic">No further order actions for this status.</span>
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
                      {isAdmin && (
                        <div className="border-t pt-2">
                          <p className="text-xs font-semibold mb-1">🚚 Delivery Info</p>
                          <button
                            onClick={() => startDeliveryEdit(o)}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 font-semibold"
                          >
                            Edit Delivery
                          </button>
                          {o.deliveryCompanyName && (
                            <p className="text-xs text-gray-700 mt-2">Company: {o.deliveryCompanyName}</p>
                          )}
                          {o.trackingId && (
                            <p className="text-xs text-gray-700">Tracking: {o.trackingId}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                {deliveryEditOrderId === o._id && (
                  <tr className="bg-slate-50">
                    <td colSpan={8} className="p-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Company</label>
                          <input
                            type="text"
                            value={deliveryCompanyName}
                            onChange={(e) => setDeliveryCompanyName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Courier / Delivery Partner Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Tracking ID</label>
                          <input
                            type="text"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Tracking ID"
                          />
                        </div>
                        <div className="lg:col-span-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Details</label>
                          <textarea
                            value={deliveryCompanyDetails}
                            onChange={(e) => setDeliveryCompanyDetails(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Add delivery partner details, courier service, expected delivery notes, etc."
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => saveDeliveryDetails(o._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save Delivery Details
                        </button>
                        <button
                          onClick={cancelDeliveryEdit}
                          className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
      </table>
        </div>
      )}
    </div>
  );
}