'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/components/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BusinessSettings {
  bankAccountNumber?: string;
  upiId?: string;
  whatsapp?: string;
  contactWhatsapp?: string;
  contactWhatsappColor?: string;
  contactEmail?: string;
  contactEmailColor?: string;
  contactInfoEnabled?: boolean;
  websiteNameColor?: string;
  adminWhatsapp?: string;
  staffWhatsapp?: string;
  paymentVerificationStartTime?: string;
  paymentVerificationEndTime?: string;
  freeShippingThreshold?: number;
  defaultShippingCharge?: number;
  stateShippingCharges?: Record<string, number>;
}

const indianStates = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Goa', 'Assam', 'Puducherry', 'Chandigarh', 'Other'];

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [step, setStep] = useState(1); // 1=shipping, 2=payment, 3=password
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const getSupportWhatsapp = () => {
    if (settings.contactInfoEnabled === false) return '';
    if (settings.contactWhatsapp?.trim()) return settings.contactWhatsapp.trim();
    if (settings.staffWhatsapp?.trim()) return settings.staffWhatsapp.trim();
    if (settings.adminWhatsapp?.trim()) return settings.adminWhatsapp.trim();
    if (settings.whatsapp?.trim()) return settings.whatsapp.trim();
    return '';
  };

  const getSupportEmail = () => {
    if (settings.contactInfoEnabled === false) return '';
    if (settings.contactEmail?.trim()) return settings.contactEmail.trim();
    return '';
  };

  const [couponProducts, setCouponProducts] = useState<string[]>([]);
  const [stateSearch, setStateSearch] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gstTotal = items.reduce((acc, item) => {
    const gstPercent = item.gstPercent || 0;
    return acc + item.price * item.quantity * gstPercent / 100;
  }, 0);
  
  // Calculate eligible items total for product-specific coupons
  const eligibleTotal = couponProducts.length > 0 
    ? items.reduce((acc, item) => {
        if (couponProducts.includes(item.productId)) {
          return acc + item.price * item.quantity;
        }
        return acc;
      }, 0)
    : total;

  // Calculate shipping charges based on state
  const calculateShippingCharge = () => {
    const freeThreshold = settings.freeShippingThreshold || 0;
    if (freeThreshold > 0 && total >= freeThreshold) {
      return 0;
    }
    const stateCharges = settings.stateShippingCharges || {};
    const charge = stateCharges[state];
    if (charge !== undefined && charge !== null) {
      return charge;
    }
    return settings.defaultShippingCharge || 0;
  };

  const shippingCharges = state ? calculateShippingCharge() : 0;
  const subtotalAfterDiscount = total - appliedDiscount;
  const finalTotal = subtotalAfterDiscount + gstTotal + shippingCharges;
  const filteredStates = indianStates.filter(s => 
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  useEffect(() => {
    fetch('/api/business-settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  if (!isHydrated) {
    return <div className="flex items-center justify-center min-h-screen">Loading cart...</div>;
  }

  async function validateCoupon() {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    try {
      const productIds = items.map(item => item.productId);
      const cartItems = items.map(item => ({
        productId: item.productId,
        price: item.price,
        quantity: item.quantity
      }));
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), total, productIds, cartItems }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedDiscount(data.discount);
        setCouponProducts(data.couponProducts || []);
        setDiscountType(data.discountType || 'percentage');
        setDiscountValue(data.discountValue || 0);
        setCouponError('');
      } else {
        setAppliedDiscount(0);
        setCouponProducts([]);
        setDiscountType('percentage');
        setDiscountValue(0);
        setCouponError(data.error || 'Invalid coupon');
      }
    } catch (error) {
      console.error('Coupon validation failed:', error);
      setAppliedDiscount(0);
      setCouponError('Failed to validate coupon');
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      if (data.url) {
        setPaymentScreenshot(data.url);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      setUploadError('Upload failed');
    }
  }

  async function verifyPasswordAndPlaceOrder() {
    if (!password.trim()) {
      setPasswordError('Please enter your account password to verify');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.verified) {
        setPasswordError(data.error || 'Password verification failed');
      } else {
        await finalizePlaceOrder();
      }
    } catch (error) {
      console.error('Password verification request failed:', error);
      setPasswordError('Verification request failed. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function finalizePlaceOrder() {
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
          state,
          postalCode,
          country,
          mobile,
          paymentScreenshot,
          transactionId,
          discountCoupon: couponCode.trim() || undefined,
          discountAmount: appliedDiscount,
          shippingCharges,
          shippingState: state,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        clear();
        setMessage('Order placed successfully!');
        setStep(1);
        setPassword('');
        setPasswordError('');
        // reset payment fields
        setPaymentScreenshot('');
        setTransactionId('');
        setCouponCode('');
        setAppliedDiscount(0);
        setCouponProducts([]);
        setDiscountType('percentage');
        setDiscountValue(0);
        setState('');
        // Refresh products to show updated quantities
        window.dispatchEvent(new Event('productsUpdated'));

        const customerId = session?.user?.customerId || '';
        router.push(`/order-success?orderId=${data._id}&customerId=${encodeURIComponent(customerId)}`);
        return;
      } else {
        setMessage(data.error || data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Place order failed:', error);
      setMessage('Failed to place order');
    } finally {
      setPlacingOrder(false);
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

    setMessage('');
    setPassword('');
    setPasswordError('');
    setOrderPlaced(false);
    setStep(3);
  }

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Shopping Cart</h1>
      {items.length === 0 ? (
        <p className="text-gray-700">Your cart is empty.</p>
      ) : (
        <table className="w-full mb-6 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2 text-sm font-semibold text-gray-700">Product</th>
              <th className="text-center px-3 py-2 text-sm font-semibold text-gray-700">Quantity</th>
              <th className="text-right px-3 py-2 text-sm font-semibold text-gray-700">Price</th>
              <th className="text-right px-3 py-2 text-sm font-semibold text-gray-700">Subtotal</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.productId} className="border-t even:bg-gray-50 bg-white">
                <td>{item.name}</td>
                <td className="text-center">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-2 text-white bg-gray-700 rounded disabled:bg-gray-300 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    -
                  </button>
                  <span className="mx-2 font-semibold text-gray-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-2 text-white bg-gray-700 rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    +
                  </button>
                </td>
                <td className="text-right">₹{item.price.toFixed(2)}</td>
                <td className="text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                <td className="text-right">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-lg font-semibold text-gray-800">Subtotal: ₹{total.toFixed(2)}</p>
        {appliedDiscount > 0 && (
          <p className="text-lg font-semibold text-green-700">Discount: -₹{appliedDiscount.toFixed(2)}</p>
        )}
        {gstTotal > 0 && (
          <p className="text-lg font-semibold text-purple-700">GST: ₹{gstTotal.toFixed(2)}</p>
        )}
        {state && (
          <p className="text-lg font-semibold text-blue-700">
            Shipping: {shippingCharges === 0 ? 'FREE' : `₹${shippingCharges.toFixed(2)}`}
            {shippingCharges === 0 && (settings.freeShippingThreshold || 0) > 0 && total >= (settings.freeShippingThreshold || 0) && (
              <span className="text-sm text-green-600 ml-2">(Free above ₹{(settings.freeShippingThreshold || 0).toFixed(2)})</span>
            )}
          </p>
        )}
        <p className="text-lg font-bold text-gray-900">Total: ₹{finalTotal.toFixed(2)}</p>
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
              className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled={!!session?.user?.email}
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search State..."
                  value={stateSearch}
                  onChange={e => setStateSearch(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {stateSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredStates.length > 0 ? (
                      filteredStates.map(s => (
                        <div
                          key={s}
                          onClick={() => {
                            setState(s);
                            setStateSearch('');
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-indigo-100 text-gray-900"
                        >
                          {s}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">No state found</div>
                    )}
                  </div>
                )}
              </div>
              {state && (
                <div className="text-sm text-green-700 mt-1">
                  Selected: <strong>{state}</strong>
                  <button
                    type="button"
                    onClick={() => setState('')}
                    className="ml-2 text-red-500 hover:text-red-700 underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Postal Code"
              value={postalCode}
              onChange={e => setPostalCode(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled
            />
            <input
              type="text"
              placeholder="Mobile"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {state && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Shipping Charge: <strong>{shippingCharges === 0 ? 'FREE' : `₹${shippingCharges.toFixed(2)}`}</strong>
                {shippingCharges === 0 && (settings.freeShippingThreshold || 0) > 0 && total >= (settings.freeShippingThreshold || 0) && (
                  <span className="text-green-600 ml-1">(Free shipping above ₹{(settings.freeShippingThreshold || 0).toFixed(2)})</span>
                )}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              if (!name || !email || !address || !city || !state || !postalCode || !country || !mobile) {
                setMessage('Please fill all shipping details including state');
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
            <p className="text-sm text-gray-700 mb-3">Use यह जानकारी बैंक ट्रांसफर के लिए; payment screenshot और transaction ID दें।</p>
            {settings.bankAccountNumber ? (
              <p className="text-gray-900"><strong>Bank Account:</strong> {settings.bankAccountNumber}</p>
            ) : (
              <p className="text-gray-600">Bank account details not available yet. Please contact support.</p>
            )}
            {settings.upiId ? (
              <p className="text-gray-900"><strong>UPI ID:</strong> {settings.upiId}</p>
            ) : (
              <p className="text-gray-600">UPI ID not available yet. Please contact support.</p>
            )}
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">ℹ️ Payment Verification</h3>
            <p className="text-sm text-blue-800 mb-2">Your payment will be verified during admin working hours:</p>
            <p className="text-lg font-bold text-blue-900">{settings.paymentVerificationStartTime || '09:00'} to {settings.paymentVerificationEndTime || '17:00'}</p>
            <p className="text-xs text-blue-700 mt-2">आपके भुगतान का सत्यापन इन कार्य घंटों के दौरान किया जाएगा</p>
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
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Discount Coupon Code (optional)"
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

      {step === 3 && (
        <div className="max-w-md">
          <h2 className="text-xl font-bold mb-4">Password Verification</h2>
          <p className="mb-4">अपना एकाउंट पासवर्ड दर्ज करें ताकि ऑर्डर सुनिश्चित हो सके।</p>

          <input
            type="password"
            placeholder="Enter your account password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-2"
          />
          {passwordError && <p className="text-red-600 text-sm mb-2">{passwordError}</p>}

          <button
            onClick={verifyPasswordAndPlaceOrder}
            disabled={passwordLoading || !password.trim()}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {passwordLoading ? 'Verifying...' : 'Verify Password & Place Order'}
          </button>

          <button
            onClick={() => {
              setStep(2);
              setPassword('');
              setPasswordError('');
            }}
            className="w-full mt-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Back to Payment
          </button>
        </div>
      )}

      {orderPlaced ? (
        <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
          <h3 className="font-bold text-green-800">✅ Order placed successfully!</h3>
          <p className="text-green-700">Thank you for your order. It will be processed shortly.</p>
          
          <div className="mt-4 p-3 bg-orange-50 border border-orange-300 rounded">
            <p className="text-sm font-semibold text-orange-800">⏱️ Payment Verification Schedule</p>
            <p className="text-sm text-orange-700 mt-1">Your payment will be verified during admin working hours:</p>
            <p className="text-sm font-bold text-orange-800 mt-1">{settings.paymentVerificationStartTime || '09:00'} to {settings.paymentVerificationEndTime || '17:00'}</p>
            <p className="text-xs text-orange-700 mt-2">आपके भुगतान का सत्यापन admin के कार्य समय के दौरान किया जाएगा</p>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setOrderPlaced(false);
                router.push('/');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Home
            </button>
            {settings.contactInfoEnabled !== false && getSupportWhatsapp() && (
              <a
                href={`https://wa.me/${getSupportWhatsapp().replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Contact on WhatsApp
              </a>
            )}
          </div>
          {settings.contactInfoEnabled !== false && getSupportWhatsapp() ? (
            <p className="mt-2 text-sm" style={{ color: settings.contactWhatsappColor || '#16a34a' }}>Support WhatsApp: {getSupportWhatsapp()}</p>
          ) : settings.contactInfoEnabled !== false ? (
            <p className="mt-2 text-sm text-gray-700">Whatsapp support number is not set yet.</p>
          ) : null}
          {settings.contactInfoEnabled !== false && getSupportEmail() && (
            <p className="mt-2 text-sm" style={{ color: settings.contactEmailColor || '#1d4ed8' }}>Support Email: {getSupportEmail()}</p>
          )}
          {settings.contactInfoEnabled !== false && !getSupportWhatsapp() && !getSupportEmail() && (
            <p className="mt-2 text-sm text-gray-700">Contact details not set yet.</p>
          )}
        </div>
      ) : (
        message && (
          <div className="mt-4">
            <p>{message}</p>
          </div>
        )
      )}
    </div>
  );
}
