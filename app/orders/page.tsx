'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';

interface Order {
  _id: string;
  total: number;
  discountAmount?: number;
  transactionId?: string;
  status: string;
  returnStatus: string;
  refundStatus: string;
  returnReason?: string;
  returnDeadline?: string;
  cancellationStatus: string;
  cancellationReason?: string;
  shipping?: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    mobile: string;
  };
  paymentScreenshot?: string;
  createdAt: string;
  deliveryCompanyName?: string;
  deliveryCompanyDetails?: string;
  trackingId?: string;
  products: { product: { _id: string; name: string; originalPrice: number; discountPercent: number } | null; quantity: number }[];
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<{ whatsapp?: string; contactWhatsapp?: string; contactEmail?: string; adminWhatsapp?: string; staffWhatsapp?: string; contactWhatsappColor?: string; contactEmailColor?: string; paymentVerificationStartTime?: string; paymentVerificationEndTime?: string; contactInfoEnabled?: boolean }>({});
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

    fetch('/api/business-settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          whatsapp: data.whatsapp,
          contactWhatsapp: data.contactWhatsapp,
          contactEmail: data.contactEmail,
          adminWhatsapp: data.adminWhatsapp,
          staffWhatsapp: data.staffWhatsapp,
          contactWhatsappColor: data.contactWhatsappColor || '#16a34a',
          contactEmailColor: data.contactEmailColor || '#1d4ed8',
          paymentVerificationStartTime: data.paymentVerificationStartTime || '09:00',
          paymentVerificationEndTime: data.paymentVerificationEndTime || '17:00',
          contactInfoEnabled: data.contactInfoEnabled !== false,
        });
      })
      .catch(() => {
        setSettings({});
      });
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
    } catch (error) {
      console.error('Password change request failed:', error);
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
    } catch (error) {
      console.error('Return request failed:', error);
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
    } catch (error) {
      console.error('Cancellation request failed:', error);
    }
  };

  const getVerificationTimeSlotString = () => {
    try {
      const startTime = settings.paymentVerificationStartTime || '09:00';
      const endTime = settings.paymentVerificationEndTime || '17:00';
      return `${startTime} to ${endTime}`;
    } catch {
      return '09:00 to 17:00';
    }
  };

  const sendOrderWhatsApp = (order: Order) => {
    const phone = settings.contactInfoEnabled === false ? '' : settings.contactWhatsapp || settings.whatsapp || settings.adminWhatsapp || settings.staffWhatsapp;
    if (!phone) {
      alert('No WhatsApp number configured or contact information is disabled. Please set a WhatsApp number in settings.');
      return;
    }

    const sanitizedPhone = phone.replace(/\D/g, '');
    if (!sanitizedPhone) {
      alert('Invalid WhatsApp number. Please enter a valid number in settings.');
      return;
    }

    const productLines = order.products
      .map(item => `${item.product ? item.product.name : 'Deleted Product'} x${item.quantity} @ ₹${item.product ? item.product.originalPrice : 0}`)
      .join('\n');

    const whatsappText = encodeURIComponent(
      `Order ID: ${order._id}\n` +
      `Date: ${new Date(order.createdAt).toLocaleString()}\n` +
      `Total: ₹${order.total.toFixed(2)}\n` +
      `Status: ${order.status}\n` +
      `Products:\n${productLines}\n` +
      `Shipping Name: ${order.shipping?.name || 'N/A'}\n` +
      `Contact: ${order.shipping?.mobile || 'N/A'}\n` +
      `Address: ${order.shipping?.address || 'N/A'}, ${order.shipping?.city || ''} ${order.shipping?.postalCode || ''}`
    );

    const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${whatsappText}`;
    window.open(whatsappUrl, '_blank');
  };

  const cleanInvoiceText = (value?: string) => {
    const normalized = (value || '').normalize('NFKC');
    const cleaned = normalized
      .replace(/[&\uFF06]+/g, ' ')
      .replace(/[^\p{L}\p{N}\s.,:()\/\-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned.replace(/\b(?:[A-Za-z0-9]\s+){2,}[A-Za-z0-9]\b/g, match => match.replace(/\s+/g, ''));
  };

  const downloadInvoice = (order: Order) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let top = 50;
    const addLine = (text: string, options: { size?: number; style?: 'normal' | 'bold' } = {}) => {
      const fontSize = options.size || 11;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', options.style === 'bold' ? 'bold' : 'normal');
      doc.text(text, 40, top);
      top += fontSize + 10;
      if (top > 760) {
        doc.addPage();
        top = 50;
      }
    };

    const addSectionTitle = (text: string) => {
      addLine(text, { size: 13, style: 'bold' });
      doc.setDrawColor(170);
      doc.setLineWidth(0.5);
      doc.line(40, top - 4, 555, top - 4);
      top += 8;
    };

    addLine('REFURBISHED PC STUDIO', { size: 18, style: 'bold' });
    addLine('Invoice', { size: 14, style: 'bold' });
    addLine('');
    addSectionTitle('Order Summary');
    addLine(`Order ID: ${cleanInvoiceText(order._id)}`);
    addLine(`Order Date: ${new Date(order.createdAt).toLocaleString()}`);
    addLine(`Status: ${cleanInvoiceText(order.status)}`);
    addLine(`Total Amount: ₹${order.total.toFixed(2)}`);
    if (order.discountAmount && order.discountAmount > 0) {
      addLine(`Discount: -₹${order.discountAmount.toFixed(2)}`);
    }
    if (order.trackingId) {
      addLine(`Tracking ID: ${cleanInvoiceText(order.trackingId)}`);
    }
    if (order.deliveryCompanyName) {
      addLine(`Delivery Company: ${cleanInvoiceText(order.deliveryCompanyName)}`);
    }
    if (order.deliveryCompanyDetails) {
      addLine(`Delivery Details: ${cleanInvoiceText(order.deliveryCompanyDetails)}`);
    }

    addSectionTitle('Shipping Information');
    addLine(`Name: ${cleanInvoiceText(order.shipping?.name)}`);
    addLine(`Email: ${cleanInvoiceText(order.shipping?.email)}`);
    addLine(`Mobile: ${cleanInvoiceText(order.shipping?.mobile)}`);
    addLine(`Address: ${cleanInvoiceText(order.shipping?.address)}`);
    addLine(`City: ${cleanInvoiceText(order.shipping?.city)}`);
    addLine(`Postal Code: ${cleanInvoiceText(order.shipping?.postalCode)}`);
    addLine(`Country: ${cleanInvoiceText(order.shipping?.country)}`);

    addSectionTitle('Purchased Products');
    addLine('Product', { size: 12, style: 'bold' });
    order.products.forEach(item => {
      const productName = cleanInvoiceText(item.product?.name || 'Deleted Product');
      addLine(`• ${productName} x${item.quantity} @ ₹${item.product ? item.product.originalPrice.toFixed(2) : 0}`);
    });

    addLine('');
    addSectionTitle('Payment Details');
    addLine(`Payment Transaction ID: ${cleanInvoiceText(order.transactionId)}`);

    doc.save(`invoice-${order._id}.pdf`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <h1 className="text-5xl font-black mb-2 text-blue-950 dark:text-cyan-100 leading-tight drop-shadow-lg" aria-label="My Orders" style={{ textShadow: '0 0 12px rgba(0,0,0,.35)' }}>
        My Orders
      </h1>
      <p className="mb-6 text-lg font-semibold text-slate-800 dark:text-slate-100 drop-shadow-sm">Track your latest purchases and manage returns/cancellations.</p>
      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <>
          {orders.some(order => order.status === 'Payment Pending' || order.status === 'Payment Completed') && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">⏱️ Payment Verification Time</h3>
              <p className="text-sm text-blue-800 mb-1">Your payment will be verified during admin working hours:</p>
              <p className="text-lg font-bold text-blue-900">{settings.paymentVerificationStartTime || '09:00'} to {settings.paymentVerificationEndTime || '17:00'}</p>
              <p className="text-xs text-blue-700 mt-2">आपके भुगतान का सत्यापन इन कार्य घंटों के दौरान किया जाएगा</p>
            </div>
          )}
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
                className="w-full mb-2 p-2 border rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={requestCancellation} className="px-3 py-1 bg-red-600 text-white rounded">Submit Cancellation Request</button>
                <button onClick={() => { setCancellationOrderId(null); setCancellationReason(''); }} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          )}
          <button onClick={() => setChanging(true)} className="mb-4 text-blue-600">Change Password</button>
          <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">ID</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Date</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Products</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Total</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Status</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Return Status</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Refund Status</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Cancellation Status</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <React.Fragment key={order._id}>
                <tr className="border-t bg-white even:bg-gray-50">
                  <td className="p-2 text-gray-800">{order._id.slice(-8)}</td>
                <td className="p-2">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="p-2">
                  {order.products.map((item, idx) => (
                    <div key={`${order._id}-${item.product?._id || 'deleted'}-${idx}`}>{item.product ? item.product.name : 'Deleted Product'} x{item.quantity}</div>
                  ))}
                </td>
                <td className="p-2">₹{order.total.toFixed(2)}</td>
                <td className="p-2">
                  <div>
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      order.status === 'Payment Pending' ? 'bg-orange-100 text-orange-800' :
                      order.status === 'Payment Completed' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Payment Verified' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'Payment Rejected' ? 'bg-red-100 text-red-800' :
                      order.status === 'Order Preparing' ? 'bg-sky-100 text-sky-800' :
                      order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'Order Rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'Payment Completed' ? 'Payment Completed (पेमेंट पूरा, admin सत्यापन बाकी)' : order.status}
                    </span>
                  </div>
                  {order.status === 'Payment Completed' && (
                    <p className="text-xs text-orange-700 mt-1">
                      Payment completed but not verified by admin. <br /> भुगतान अभी तक admin द्वारा सत्यापित नहीं हुआ है। <br />
                      Admin सत्यापन समय: {getVerificationTimeSlotString()} (Admin सेट समय स्लॉट)
                    </p>
                  )}
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    order.returnStatus === 'No Return' ? 'bg-gray-100 text-gray-700' :
                    order.returnStatus === 'Return Requested' ? 'bg-orange-100 text-orange-800' :
                    order.returnStatus === 'Return Approved' ? 'bg-emerald-100 text-emerald-800' :
                    order.returnStatus === 'Return Rejected' ? 'bg-red-100 text-red-800' :
                    order.returnStatus === 'Return Received' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-green-100 text-green-800'
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
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    order.refundStatus === 'No Refund' ? 'bg-gray-100 text-gray-700' :
                    order.refundStatus === 'Refund Pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.refundStatus === 'Refund Approved' ? 'bg-green-100 text-green-800' :
                    order.refundStatus === 'Refund Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-indigo-100 text-indigo-800'
                  }`}>
                    {order.refundStatus}
                  </span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    order.cancellationStatus === 'None' ? 'bg-gray-100 text-gray-700' :
                    order.cancellationStatus === 'Cancellation Requested' ? 'bg-orange-100 text-orange-800' :
                    order.cancellationStatus === 'Cancellation Approved' ? 'bg-emerald-100 text-emerald-800' :
                    order.cancellationStatus === 'Cancellation Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.cancellationStatus}
                  </span>
                  {order.cancellationReason && (
                    <div className="text-xs text-gray-900 font-medium mt-1">
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
                      className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 mr-2"
                    >
                      Request Return
                    </button>
                  )}
                  {settings.contactInfoEnabled !== false && (settings.contactWhatsapp || settings.whatsapp || settings.adminWhatsapp || settings.staffWhatsapp) && (
                    <button
                      onClick={() => sendOrderWhatsApp(order)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 mr-2"
                    >
                      Share Order on WhatsApp
                    </button>
                  )}
                  {['Payment Verified', 'Order Preparing', 'Shipped', 'Delivered'].includes(order.status) && (
                    <button
                      onClick={() => downloadInvoice(order)}
                      className="px-3 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-800"
                    >
                      Download Invoice
                    </button>
                  )}
                </td>
              </tr>
              {(order.trackingId || order.deliveryCompanyName || order.deliveryCompanyDetails) && (
                <tr className="bg-slate-50">
                  <td colSpan={9} className="p-3 text-sm text-slate-700 border-t border-slate-200">
                    <div className="font-semibold mb-1">Delivery Details</div>
                    {order.deliveryCompanyName && <div><span className="font-medium">Company:</span> {order.deliveryCompanyName}</div>}
                    {order.trackingId && <div><span className="font-medium">Tracking ID:</span> {order.trackingId}</div>}
                    {order.deliveryCompanyDetails && <div><span className="font-medium">Details:</span> {order.deliveryCompanyDetails}</div>}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}
