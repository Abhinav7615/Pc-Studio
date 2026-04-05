'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type OrderProduct = {
  product: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
};

type Order = {
  _id: string;
  total: number;
  status: string;
  discountAmount?: number;
  discountCoupon?: string;
  transactionId?: string;
  createdAt: string;
  customer?: {
    _id: string;
    name: string;
    email: string;
    mobile: string;
  };
  products: OrderProduct[];
  shipping: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    mobile: string;
  };
};

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const customerId = searchParams.get('customerId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportNumber, setSupportNumber] = useState('');
  const [orderImageUrl, setOrderImageUrl] = useState('');
  const [settings, setSettings] = useState<{ paymentVerificationStartTime?: string; paymentVerificationEndTime?: string; contactWhatsapp?: string; contactEmail?: string; contactWhatsappColor?: string; contactEmailColor?: string }>({});

  const getVerificationTimeSlotString = () => {
    try {
      const startTime = settings.paymentVerificationStartTime || '09:00';
      const endTime = settings.paymentVerificationEndTime || '17:00';
      return `${startTime} to ${endTime}`;
    } catch {
      return '09:00 to 17:00';
    }
  };

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Order not found');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    async function fetchSettings() {
      try {
        const res = await fetch('/api/business-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.contactWhatsapp) {
            setSupportNumber(data.contactWhatsapp);
          } else if (data.staffWhatsapp) {
            setSupportNumber(data.staffWhatsapp);
          } else if (data.adminWhatsapp) {
            setSupportNumber(data.adminWhatsapp);
          } else if (data.whatsapp) {
            setSupportNumber(data.whatsapp);
          }
          setSettings({
            paymentVerificationStartTime: data.paymentVerificationStartTime || '09:00',
            paymentVerificationEndTime: data.paymentVerificationEndTime || '17:00',
            contactWhatsapp: data.contactWhatsapp || '',
            contactEmail: data.contactEmail || '',
            contactWhatsappColor: data.contactWhatsappColor || '#16a34a',
            contactEmailColor: data.contactEmailColor || '#1d4ed8',
          });
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    }

    fetchOrder();
    fetchSettings();
  }, [orderId]);

  const makeWhatsAppLink = () => {
    const number = supportNumber.replace(/\D/g, '') || '';
    const textLines = [
      `Order confirmation received!`,
      order ? `Order ID: ${order._id}` : `Order ID: ${orderId}`,
      customerId ? `Customer ID: ${customerId}` : '',
      order ? `Total: ₹${order.total.toFixed(2)}` : '',
      `Please assist me with order tracking.`,
    ].filter(Boolean);
    const encoded = encodeURIComponent(textLines.join(' '));
    if (!number) return '#';
    return `https://wa.me/${number}?text=${encoded}`;
  };

  const drawOrderImageUrl = (order: Order) => {
    const width = 1080;
    const lineHeight = 36;
    const padding = 48;
    const headerHeight = 100;
    const productsHeight = order.products.length * 30;
    const shippingHeight = 120;
    const rows = 10 + order.products.length;
    const height = headerHeight + 20 + (rows * lineHeight) + productsHeight + shippingHeight + 40;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText('Order Placed Successfully ✅', padding, 52);

    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillStyle = '#1f2937';
    const lines = [
      `Order ID: ${order._id}`,
      `Customer ID: ${customerId ?? 'N/A'}`,
      `Status: ${order.status === 'Payment Completed' ? 'Payment Completed (पेमेंट पूरा, admin सत्यापन बाकी)' : order.status}`,
      `Total: ₹${order.total.toFixed(2)}`,
      `Discount: ₹${order.discountAmount ?? 0}`,
      `Payment ID: ${order.transactionId ?? 'N/A'}`,
      `Placed on: ${new Date(order.createdAt).toLocaleString()}`,
      'Products:',
      ...order.products.map(p => `  • ${p.product?.name ?? 'Unknown'} x ${p.quantity} @ ₹${(p.product?.price ?? 0).toFixed(2)}`),
      'Shipping:',
      `  ${order.shipping.name}`,
      `  ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.postalCode}, ${order.shipping.country}`,
      `  ${order.shipping.mobile}`,
    ];

    let ypos = 100;
    for (const line of lines) {
      ctx.fillText(line, padding, ypos + lineHeight);
      ypos += lineHeight;
    }

    return canvas.toDataURL('image/png');
  };

  const generateOrderImage = () => {
    if (!order) return;
    const imageUrl = drawOrderImageUrl(order);
    if (imageUrl) {
      setOrderImageUrl(imageUrl);
    }
  };

  const downloadOrderImage = () => {
    if (!order) return;
    if (!orderImageUrl) {
      generateOrderImage();
    }
    const url = orderImageUrl || drawOrderImageUrl(order);
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order._id}.png`;
    a.click();
  };

  const shareOrderImage = async () => {
    if (!order) return;

    const imageUrl = orderImageUrl || drawOrderImageUrl(order);
    if (!imageUrl) {
      alert('Failed to generate image for sharing.');
      return;
    }

    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `order-${order._id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Order Placed: ' + order._id,
          text: 'Order Placed Successfully - see invoice image.',
          files: [file],
        });
      } else {
        alert('Sharing images is not supported on this device/browser. Please download the image first.');
      }
    } catch (err) {
      console.error('Image share failed', err);
      alert('Failed to share image. Please use download.');
    }
  };

  const downloadOrder = () => {
    if (!order) return;
    const orderText = [
      `Order ID: ${order._id}`,
      `Customer ID: ${customerId || 'N/A'}`,
      `Order Status: ${order.status}`,
      `Payment ID: ${order.transactionId ?? 'N/A'}`,
      `Total: ₹${order.total.toFixed(2)}`,
      `Discount Coupon: ${order.discountCoupon ?? 'None'}`,
      `Discount Amount: ₹${order.discountAmount ?? 0}`,
      'Products:',
      ...order.products.map(p => `- ${p.product?.name ?? 'Unknown'} (Qty: ${p.quantity})`),
      'Shipping details:',
      `- ${order.shipping.name}`,
      `- ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.postalCode}, ${order.shipping.country}`,
      `- Mobile: ${order.shipping.mobile}`,
    ].join('\n');

    const blob = new Blob([orderText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order._id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8">Loading order details...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Order Details</h1>
        <p className="text-red-600">{error}</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => router.push('/')}>Go to Home</button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Order Details</h1>
        <p>No order data available.</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => router.push('/')}>Go to Home</button>
      </div>
    );
  }

  const supportNumberDigits = supportNumber.replace(/\D/g, '');
  const whatsappUrl = supportNumberDigits ? `https://wa.me/${supportNumberDigits}` : undefined;

  return (
    <div className="p-8 bg-gray-50 min-h-[70vh]">
      <h1 className="text-2xl font-bold mb-4">✅ Order Placed Successfully</h1>
      <p className="mb-2">Thank you for your purchase! Your order is under review and will be confirmed soon.</p>

      <div className="bg-white p-4 shadow rounded mb-4">
        <div className="mb-2"><strong>Order ID:</strong> {order._id}</div>
        <div className="mb-2"><strong>Customer ID:</strong> {customerId ?? 'N/A'}</div>
        <div className="mb-2"><strong>Status:</strong> {order.status}</div>
        {order.status === 'Payment Completed' && (
          <div className="mb-2 text-orange-700">
            <strong>Note:</strong> Payment completed but not verified by admin.
            <br />
            पेमेंट पूरा, लेकिन admin द्वारा अभी तक सत्यापित नहीं हुआ है।
            <br />
            Admin सत्यापन समय: {getVerificationTimeSlotString()}
            (Admin सेट समय स्लॉट)
          </div>
        )}
        <div className="mb-2"><strong>Total:</strong> ₹{order.total.toFixed(2)}</div>
        <div className="mb-2"><strong>Discount:</strong> ₹{order.discountAmount ?? 0}</div>
        <div className="mb-2"><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleString()}</div>
      </div>

      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Products</h2>
        <ul className="space-y-1">
          {order.products.map((item, idx) => (
            <li key={idx} className="border-b pb-2 mb-2">
              {item.product?.name || 'Item'} x {item.quantity} (price: ₹{(item.product?.price ?? 0).toFixed(2)})
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Shipping</h2>
        <p>{order.shipping.name}</p>
        <p>{order.shipping.address}, {order.shipping.city}, {order.shipping.postalCode}, {order.shipping.country}</p>
        <p>Mobile: {order.shipping.mobile}</p>
      </div>

      {orderImageUrl && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Generated Image Preview</h2>
          <div className="w-full max-w-xl border rounded overflow-hidden">
            <Image src={orderImageUrl} alt="Order summary image" width={800} height={450} className="w-full h-auto" />
          </div>
        </div>
      )}

      {(settings.contactWhatsapp || supportNumber || settings.contactEmail) && (
        <div className="bg-green-50 p-4 rounded-lg shadow mb-4 border border-green-300">
          <h3 className="text-lg font-semibold text-green-800 mb-1">Contact Support</h3>
          {(settings.contactWhatsapp || supportNumber) && (
            <p style={{ color: settings.contactWhatsappColor || '#16a34a' }}>WhatsApp: {settings.contactWhatsapp || supportNumber}</p>
          )}
          {settings.contactEmail && (
            <p style={{ color: settings.contactEmailColor || '#1d4ed8' }}>Email: {settings.contactEmail}</p>
          )}
          {(settings.contactWhatsapp || supportNumber) && (
            <a
              href={`https://wa.me/${(settings.contactWhatsapp || supportNumber || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-green-700 hover:underline"
            >
              Click here to message on WhatsApp
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={generateOrderImage} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700">Generate Image</button>
        <button onClick={downloadOrderImage} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Download Image</button>
        <button onClick={shareOrderImage} className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Share Image</button>
        <button onClick={downloadOrder} className="px-4 py-2 bg-indigo-600/90 text-white rounded hover:bg-indigo-700">Download Text (fallback)</button>

        <a
          href={makeWhatsAppLink()}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Share via WhatsApp
        </a>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Contact Support on WhatsApp
          </a>
        )}

        <button onClick={() => router.push('/orders')} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">View My Orders</button>
      </div>
    </div>
  );
}
