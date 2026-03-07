'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/components/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BusinessSettings {
  bankAccountNumber?: string;
  upiId?: string;
  whatsapp?: string;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [mobile, setMobile] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<BusinessSettings>({});

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    fetch('/api/business-settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setPaymentScreenshot(data.url);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Upload failed');
    }
  }

  async function placeOrder() {
    if (!session) {
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      setMessage('Cart is empty');
      return;
    }

    if (!paymentScreenshot) {
      setMessage('Please upload payment screenshot');
      return;
    }

    setPlacingOrder(true);
    setMessage('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: items,
          name,
          email,
          address,
          city,
          postalCode,
          country,
          mobile,
          paymentScreenshot,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        clear();
        setMessage('Order placed successfully! Please contact us on WhatsApp for support.');
        if (settings.whatsapp) {
          setMessage(prev => prev + ` WhatsApp: ${settings.whatsapp}`);
        }
      } else {
        setMessage(data.error || data.message || 'Failed to place order');
      }
    } catch (err) {
      setMessage('Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <table className="w-full mb-6">
          <thead>
            <tr>
              <th className="text-left">Product</th>
              <th className="text-center">Quantity</th>
              <th className="text-right">Price</th>
              <th className="text-right">Subtotal</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.productId} className="border-t">
                <td>{item.name}</td>
                <td className="text-center">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-2"
                  >
                    -
                  </button>
                  {item.quantity}
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-2"
                  >
                    +
                  </button>
                </td>
                <td className="text-right">₹{item.price.toFixed(2)}</td>
                <td className="text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                <td className="text-right">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mb-6">
        <p className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</p>
      </div>

      <div className="mb-6 bg-white border border-gray-200 p-4 rounded-lg text-gray-900">
        <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
        {settings.bankAccountNumber && (
          <p className="text-gray-900"><strong>Bank Account:</strong> {settings.bankAccountNumber}</p>
        )}
        {settings.upiId && (
          <p className="text-gray-900"><strong>UPI ID:</strong> {settings.upiId}</p>
        )}
        <p className="text-sm text-gray-700 mt-2">Please make payment and upload screenshot below.</p>
      </div>

      <div className="max-w-md">
        <h2 className="text-xl font-bold mb-2">Shipping details</h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            disabled={!!session?.user?.email}
          />
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Postal Code"
            value={postalCode}
            onChange={e => setPostalCode(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Mobile"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div className="mt-4">
          <label className="block mb-1">Payment screenshot</label>
          <input type="file" onChange={handleFileChange} />
          {paymentScreenshot && (
            <div className="mt-2">
              <img src={paymentScreenshot} alt="screenshot" className="max-h-40" />
            </div>
          )}
          {uploadError && <p className="text-red-600">{uploadError}</p>}
        </div>

        <button
          onClick={placeOrder}
          disabled={placingOrder}
          className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {placingOrder ? 'Placing order...' : 'Place Order'}
        </button>
        {message && (
          <div className="mt-4">
            <p>{message}</p>
            {settings.whatsapp && message.includes('successfully') && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Contact on WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
