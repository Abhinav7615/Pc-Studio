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
  onlinePaymentsEnabled?: boolean;
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
  
  // Cashfree Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cashfree' | 'manual'>('manual');
  const [cashfreeLoading, setCashfreeLoading] = useState(false);
  const [cashfreeError, setCashfreeError] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [stockWarning, setStockWarning] = useState('');
  const [canPlaceOrder, setCanPlaceOrder] = useState(true);
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
  const finalTotal = subtotalAfterDiscount + gstTotal + shippingCharges; // Include GST and shipping in final total
  const filteredStates = indianStates.filter(s => 
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  useEffect(() => {
    fetch('/api/business-settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  // If admin disables online payments, ensure paymentMethod falls back to manual
  useEffect(() => {
    if (settings && settings.onlinePaymentsEnabled === false && paymentMethod === 'cashfree') {
      setPaymentMethod('manual');
    }
  }, [settings?.onlinePaymentsEnabled]);

  useEffect(() => {
    async function refreshCartStock() {
      if (items.length === 0) {
        setStockMap({});
        setStockWarning('');
        setCanPlaceOrder(true);
        return;
      }

      const uniqueIds = Array.from(new Set(items.map(item => item.productId)));
      const stockResults: Record<string, number> = {};
      const issues: string[] = [];

      await Promise.all(uniqueIds.map(async (productId) => {
        try {
          const res = await fetch(`/api/products/${productId}`);
          if (!res.ok) {
            stockResults[productId] = 0;
            return;
          }
          const product = await res.json();
          stockResults[productId] = Number(product.quantity) || 0;
        } catch (_) {
          stockResults[productId] = 0;
        }
      }));

      items.forEach(item => {
        const available = stockResults[item.productId] ?? 0;
        if (available <= 0) {
          issues.push(`${item.name} is out of stock.`);
        } else if (item.quantity > available) {
          issues.push(`${item.name} only has ${available} available.`);
        }
      });

      setStockMap(stockResults);
      setStockWarning(issues.join(' '));
      setCanPlaceOrder(issues.length === 0);
    }

    refreshCartStock();
  }, [items]);

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

  // Cashfree Online Payment Function
  async function initiateCashfreePayment() {
    if (!session) {
      router.push('/login');
      return;
    }

    if (settings.onlinePaymentsEnabled === false) {
      setCashfreeError('Online payments are currently disabled. Please use Bank Transfer.');
      return;
    }

    if (items.length === 0) {
      setCashfreeError('Cart is empty');
      return;
    }

    if (!canPlaceOrder) {
      setCashfreeError('Some cart items are out of stock or exceed available quantity.');
      return;
    }

    if (!name || !email || !address || !city || !state || !postalCode || !country || !mobile) {
      setCashfreeError('Please fill all shipping details first');
      return;
    }

    setCashfreeLoading(true);
    setCashfreeError('');
    setMessage('');

    try {
      // First, create order in our system with "Payment Processing" status
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
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
          paymentMethod: 'cashfree',
          discountCoupon: couponCode.trim() || undefined,
          appliedDiscount,
          shippingCharges,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setCashfreeError(orderData.error || 'Failed to create order');
        setCashfreeLoading(false);
        return;
      }

      // Now create payment session with Cashfree
      const paymentRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          orderId: orderData.orderNumber || orderData._id,
          customerId: session.user?.customerId || session.user?.id,
          customerEmail: email,
          customerPhone: mobile,
        }),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        if (paymentData.code === 'PAYMENT_NOT_CONFIGURED') {
          // Fallback to manual payment if Cashfree not configured
          setPaymentMethod('manual');
          setCashfreeError('Online payment not available. Please use manual payment method.');
        } else {
          setCashfreeError(paymentData.error || 'Failed to initiate payment');
        }
        setCashfreeLoading(false);
        return;
      }

      // If we got a payment link, redirect to Cashfree
      if (paymentData.paymentLink) {
        sessionStorage.setItem('pendingCashfreeOrder', JSON.stringify({
          orderId: orderData._id,
          cfOrderId: paymentData.cfOrderId,
          paymentLink: paymentData.paymentLink,
        }));
        window.location.href = paymentData.paymentLink;
        return;
      }

      // If the gateway returned a redirect path for checkout, use it
      if (paymentData.checkoutRedirect) {
        sessionStorage.setItem('pendingCashfreeOrder', JSON.stringify({
          orderId: orderData._id,
          cfOrderId: paymentData.cfOrderId,
        }));
        router.push(paymentData.checkoutRedirect);
        return;
      }

      // If no payment link but session created, and no checkout redirect, fallback to return page
      if (paymentData.paymentSessionId) {
        sessionStorage.setItem('pendingCashfreeOrder', JSON.stringify({
          orderId: orderData._id,
          cfOrderId: paymentData.cfOrderId,
        }));
        router.push(`/payment-return?order_id=${orderData.orderNumber || orderData._id}&cf_order_id=${paymentData.cfOrderId}`);
        return;
      }

      setCashfreeError('Unable to create payment session');
    } catch (error) {
      console.error('Cashfree payment error:', error);
      setCashfreeError('Payment failed. Please try again or use manual payment.');
    } finally {
      setCashfreeLoading(false);
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

    if (!canPlaceOrder) {
      setMessage('Some cart items are out of stock or exceed available quantity. Please update your cart.');
      return;
    }

    // Check payment method
    if (paymentMethod === 'cashfree') {
      // For Cashfree, initiate payment instead
      await initiateCashfreePayment();
      return;
    }

    // Manual payment requires screenshot and transaction ID
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
                <td>
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stockMap[item.productId] === 0
                      ? 'Out of stock'
                      : stockMap[item.productId] !== undefined
                      ? `${stockMap[item.productId]} available`
                      : 'Checking stock...'}
                  </div>
                </td>
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
                    onClick={() => {
                      const available = stockMap[item.productId] ?? item.quantity + 1;
                      if (item.quantity + 1 > available) {
                        setMessage(`Cannot increase ${item.name} beyond available stock.`);
                        return;
                      }
                      updateQuantity(item.productId, item.quantity + 1);
                    }}
                    disabled={stockMap[item.productId] !== undefined && item.quantity >= (stockMap[item.productId] || 0)}
                    className="px-2 text-white bg-gray-700 rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-300 disabled:text-gray-500"
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
        <p className="text-lg font-semibold text-gray-800">Subtotal (before GST): ₹{total.toFixed(2)}</p>
        {stockWarning && (
          <p className="text-sm text-red-600 mt-2">{stockWarning}</p>
        )}
        {!canPlaceOrder && (
          <p className="text-sm text-red-600 mt-2 font-semibold">Your cart contains unavailable items or too many quantities. Please update before placing the order.</p>
        )}
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
        <p className="text-lg font-bold text-gray-900">Total payable: ₹{finalTotal.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">Total includes product price, GST, and shipping charges.</p>
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
          {/* Payment Method Selection */}
          <div className="mb-4 md:mb-6 bg-white border border-gray-200 p-3 md:p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 md:mb-4 text-gray-900">Select Payment Method</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {/* Cashfree Online Payment (show only if enabled in admin settings) */}
              {settings.onlinePaymentsEnabled !== false && (
                <div
                  onClick={() => {
                    if (settings.onlinePaymentsEnabled === false) return;
                    setPaymentMethod('cashfree');
                  }}
                  className={`p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all min-h-[80px] ${
                    paymentMethod === 'cashfree'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === 'cashfree' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'cashfree' && (
                        <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm md:text-base">💳 Online Payment</h4>
                      <p className="text-xs md:text-sm text-gray-600">Pay instantly via Cashfree (UPI, Card, Net Banking)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Bank Transfer */}
              <div
                onClick={() => setPaymentMethod('manual')}
                className={`p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all min-h-[80px] ${
                  paymentMethod === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === 'manual' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'manual' && (
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">🏦 Bank Transfer</h4>
                    <p className="text-xs md:text-sm text-gray-600">Transfer manually & upload screenshot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cashfree Payment Option */}
          {paymentMethod === 'cashfree' && (
            <div className="mb-4 md:mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-300 p-4 md:p-6 rounded-lg">
              <div className="text-center">
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">💳</div>
                <h3 className="text-lg md:text-xl font-bold text-green-800 mb-1 md:mb-2">Online Payment via Cashfree</h3>
                <p className="text-gray-700 mb-3 md:mb-4 text-sm md:text-base">
                  Pay securely using UPI, Debit/Credit Card, or Net Banking.<br/>
                  <span className="text-green-700 font-semibold">Instant payment confirmation!</span>
                </p>
                
                <div className="bg-white p-3 md:p-4 rounded-lg mb-3 md:mb-4">
                  <p className="text-xl md:text-2xl font-bold text-gray-900">Total: ₹{finalTotal.toFixed(2)}</p>
                  <p className="text-xs md:text-sm text-gray-500">Including GST & Shipping</p>
                </div>

                {cashfreeError && (
                  <div className="mb-3 md:mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-red-700 text-sm">{cashfreeError}</p>
                  </div>
                )}

                <button
                  onClick={placeOrder}
                  disabled={cashfreeLoading || !canPlaceOrder}
                  className="w-full px-4 md:px-6 py-3 md:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {cashfreeLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Payment...
                    </>
                  ) : (
                    <>Pay ₹{finalTotal.toFixed(2)} with Cashfree →</>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-3">
                  🔒 Secure payment powered by Cashfree | Supported: UPI, Cards, Net Banking
                </p>
              </div>
            </div>
          )}

          {/* Manual Payment Option */}
          {paymentMethod === 'manual' && (
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
                  disabled={placingOrder || !canPlaceOrder}
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
