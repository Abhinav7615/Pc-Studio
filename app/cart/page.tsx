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

interface Coupon {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  expirationDays: number;
  createdAt: string;
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
  const [transactionId, setTransactionId] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [step, setStep] = useState(1); // 1=shipping, 2=payment
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const finalTotal = total - appliedDiscount;

  useEffect(() => {
    fetch('/api/business-settings')
      .then(res => res.json())
      .then(data => setSettings(data));

    // Fetch available coupons for logged-in users
    if (session) {
      fetchAvailableCoupons();
    }
  }, [session]);

  const fetchAvailableCoupons = async () => {
    try {
      const res = await fetch('/api/user/coupons');
      if (res.ok) {
        const coupons = await res.json();
        setAvailableCoupons(coupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  async function validateCoupon() {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), total }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedDiscount(data.discount);
        setCouponError('');
        setSelectedCoupon(null); // Clear selected coupon when manual code is applied
      } else {
        setAppliedDiscount(0);
        setCouponError(data.error || 'Invalid coupon');
      }
    } catch (err) {
      setAppliedDiscount(0);
      setCouponError('Failed to validate coupon');
    }
  }

  const applyCoupon = async (coupon: Coupon) => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon.code, total }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedDiscount(data.discount);
        setCouponCode(coupon.code);
        setCouponError('');
        setSelectedCoupon(coupon);
      } else {
        setAppliedDiscount(0);
        setCouponError(data.error || 'Invalid coupon');
      }
    } catch (err) {
      setAppliedDiscount(0);
      setCouponError('Failed to apply coupon');
    }
  };

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
    } catch (_err) {
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

    if (!paymentScreenshot || !transactionId.trim()) {
      setMessage('Please upload payment screenshot and enter transaction ID');
      return;
    }

    setPlacingOrder(true);
    setMessage('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
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
          transactionId,
          discountCoupon: couponCode.trim() || undefined,
          discountAmount: appliedDiscount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        clear();
        setMessage('Order placed successfully! Payment completed but pending verification by seller. Please contact us on WhatsApp for support.');
        setStep(1);
        // reset payment fields
        setPaymentScreenshot('');
        setTransactionId('');
        if (settings.whatsapp) {
          setMessage(prev => prev + ` WhatsApp: ${settings.whatsapp}`);
        }
        // Refresh products to show updated quantities
        window.dispatchEvent(new Event('productsUpdated'));
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
        <p className="text-lg font-semibold">Subtotal: ₹{total.toFixed(2)}</p>
        {appliedDiscount > 0 && (
          <p className="text-lg font-semibold text-green-600">Discount: -₹{appliedDiscount.toFixed(2)}</p>
        )}
        <p className="text-lg font-semibold">Total: ₹{finalTotal.toFixed(2)}</p>
      </div>

      {step === 1 && (
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
          <button
            onClick={() => {
              if (!name || !email || !address || !city || !postalCode || !country || !mobile) {
                setMessage('Please fill all shipping details');
                return;
              }
              setMessage('');
              setStep(2);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Continue to Payment
          </button>
        </div>
      )}

      {step === 2 && (
        <>
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
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-2"
            />
            {uploadError && <p className="text-red-600">{uploadError}</p>}
            <input
              type="text"
              placeholder="Transaction ID"
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-2"
            />
            <div className="mb-2">
              {availableCoupons.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Your Available Coupons:</p>
                  <div className="space-y-2">
                    {availableCoupons.map((coupon) => (
                      <div key={coupon._id} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                        <div>
                          <span className="font-mono font-bold text-blue-600">{coupon.code}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({coupon.discountType === 'fixed' ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`} off)
                          </span>
                        </div>
                        <button
                          onClick={() => applyCoupon(coupon)}
                          disabled={selectedCoupon?._id === coupon._id}
                          className={`px-3 py-1 text-sm rounded ${
                            selectedCoupon?._id === coupon._id
                              ? 'bg-green-600 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {selectedCoupon?._id === coupon._id ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or enter coupon code manually"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  className="flex-1 border px-3 py-2 rounded"
                />
                <button
                  onClick={validateCoupon}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-red-600 text-sm mt-1">{couponError}</p>}
            </div>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Place Order
            </button>
            <button
              onClick={() => setStep(1)}
              className="mt-2 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Back to Shipping
            </button>
          </div>
        </>
      )}

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
  );
}
