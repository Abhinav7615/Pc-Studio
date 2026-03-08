'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Order {
  _id: string;
  total: number;
  status: string;
  returnStatus: string;
  refundStatus: string;
  returnReason?: string;
  returnDeadline?: string;
  cancellationStatus: string;
  cancellationReason?: string;
  shipping?: any;
  paymentScreenshot?: string;
  createdAt: string;
  products: { product: { _id: string; name: string; originalPrice: number; discountPercent: number } | null; quantity: number }[];
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetch('/api/orders', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setOrders([]);
        } else {
          setOrders(data);
        }
      })
      .finally(() => setLoading(false));
  }, [session, status, router]);

  if (status === 'loading') return <div className="p-8"><p>Loading...</p></div>;
  if (!session) return null;

  const changePassword = async () => {
    setPwdMsg(null);
    try {
      const res = await fetch(`/api/users/${session.user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdMsg(data.error || 'Failed');
      } else {
        setPwdMsg('Password changed');
        setCurrentPwd('');
        setNewPwd('');
        setChanging(false);
      }
    } catch (err) {
      setPwdMsg('Request failed');
    }
  };

  const requestReturn = async () => {
    if (!returnOrderId || !returnReason.trim()) return;

    try {
      const res = await fetch(`/api/orders/${returnOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnStatus: 'Return Requested', returnReason: returnReason.trim() }),
      });
      if (res.ok) {
        setReturnOrderId(null);
        setReturnReason('');
        // Refresh orders
        fetch('/api/orders')
          .then(res => res.json())
          .then(data => setOrders(data.error ? [] : data));
      }
    } catch (err) {
      console.error('Return request failed');
    }
  };

  const requestCancellation = async () => {
    if (!cancellationOrderId || !cancellationReason.trim()) return;

    try {
      const res = await fetch(`/api/orders/${cancellationOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationStatus: 'Cancellation Requested', cancellationReason: cancellationReason.trim() }),
      });
      if (res.ok) {
        setCancellationOrderId(null);
        setCancellationReason('');
        // Refresh orders
        fetch('/api/orders')
          .then(res => res.json())
          .then(data => setOrders(data.error ? [] : data));
      }
    } catch (err) {
      console.error('Cancellation request failed');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <>
          {changing && (
            <div className="mb-6 p-4 border rounded bg-white">
              <h2 className="font-semibold mb-2">Change Password</h2>
              {pwdMsg && <p className="text-sm text-center mb-2">{pwdMsg}</p>}
              <input
                type="password"
                placeholder="Current password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
              />
              <div className="flex gap-2">
                <button onClick={changePassword} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                <button onClick={() => setChanging(false)} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          )}
          {returnOrderId && (
            <div className="mb-6 p-4 border rounded bg-white">
              <h2 className="font-semibold mb-2">Request Return</h2>
              <textarea
                placeholder="Please provide reason for return"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={requestReturn} className="px-3 py-1 bg-orange-600 text-white rounded">Submit Return Request</button>
                <button onClick={() => { setReturnOrderId(null); setReturnReason(''); }} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          )}
          {cancellationOrderId && (
            <div className="mb-6 p-4 border rounded bg-white">
              <h2 className="font-semibold mb-2">Request Cancellation</h2>
              <textarea
                placeholder="Please provide reason for cancellation"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={requestCancellation} className="px-3 py-1 bg-red-600 text-white rounded">Submit Cancellation Request</button>
                <button onClick={() => { setCancellationOrderId(null); setCancellationReason(''); }} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          )}
          <button onClick={() => setChanging(true)} className="mb-4 text-blue-600">Change Password</button>
          <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Products</th>
              <th className="text-left p-2">Total</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Return Status</th>
              <th className="text-left p-2">Refund Status</th>
              <th className="text-left p-2">Cancellation Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} className="border-t">
                <td className="p-2">{order._id.slice(-8)}</td>
                <td className="p-2">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="p-2">
                  {order.products.map((item, idx) => (
                    <div key={`${order._id}-${item.product?._id || 'deleted'}-${idx}`}>{item.product ? item.product.name : 'Deleted Product'} x{item.quantity}</div>
                  ))}
                </td>
                <td className="p-2">₹{order.total.toFixed(2)}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm text-black ${
                    order.status === 'Payment Pending' ? 'bg-gray-100' :
                    order.status === 'Payment Completed' ? 'bg-yellow-100' :
                    order.status === 'Payment Verified' ? 'bg-green-100' :
                    order.status === 'Payment Rejected' ? 'bg-red-100' :
                    order.status === 'Order Preparing' ? 'bg-blue-100' :
                    order.status === 'Shipped' ? 'bg-purple-100' :
                    order.status === 'Delivered' ? 'bg-green-200' :
                    order.status === 'Order Rejected' ? 'bg-red-200' :
                    'bg-gray-100'
                  }`}>{order.status}</span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm text-black ${
                    order.returnStatus === 'No Return' ? 'bg-gray-100' :
                    order.returnStatus === 'Return Requested' ? 'bg-yellow-100' :
                    order.returnStatus === 'Return Approved' ? 'bg-blue-100' :
                    order.returnStatus === 'Return Rejected' ? 'bg-red-100' :
                    order.returnStatus === 'Return Received' ? 'bg-purple-100' :
                    'bg-green-100'
                  }`}>
                    {order.returnStatus}
                  </span>
                  {order.returnReason && (
                    <div className="text-xs text-gray-700 font-medium mt-1">
                      Reason: {order.returnReason}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm text-black ${
                    order.refundStatus === 'No Refund' ? 'bg-gray-100' :
                    order.refundStatus === 'Refund Pending' ? 'bg-yellow-100' :
                    order.refundStatus === 'Refund Approved' ? 'bg-blue-100' :
                    order.refundStatus === 'Refund Rejected' ? 'bg-red-100' :
                    'bg-green-100'
                  }`}>
                    {order.refundStatus}
                  </span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm text-black ${
                    order.cancellationStatus === 'None' ? 'bg-gray-100' :
                    order.cancellationStatus === 'Cancellation Requested' ? 'bg-yellow-100' :
                    order.cancellationStatus === 'Cancellation Approved' ? 'bg-blue-100' :
                    order.cancellationStatus === 'Cancellation Rejected' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}>
                    {order.cancellationStatus}
                  </span>
                  {order.cancellationReason && (
                    <div className="text-xs text-gray-700 font-medium mt-1">
                      Reason: {order.cancellationReason}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  {order.status !== 'Delivered' && order.cancellationStatus === 'None' && (
                    <button
                      onClick={() => setCancellationOrderId(order._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 mr-2"
                    >
                      Request Cancellation
                    </button>
                  )}
                  {order.status === 'Delivered' && order.returnStatus === 'No Return' && order.returnDeadline && new Date(order.returnDeadline) > new Date() && (
                    <button
                      onClick={() => setReturnOrderId(order._id)}
                      className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                    >
                      Request Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}
