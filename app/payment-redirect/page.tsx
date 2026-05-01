'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const PAYMENT_URLS = {
  sandbox: 'https://sandbox.cashfree.com/checkout/post',
  production: 'https://www.cashfree.com/checkout/post',
};

export default function PaymentRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const session = searchParams.get('sessionId') || '';
    const order = searchParams.get('orderId') || '';
    setSessionId(session);
    setOrderId(order);

    // Get stored payment link directly
    const stored = sessionStorage.getItem('pendingCashfreeOrder');
    let paymentLink = '';
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        paymentLink = parsed.paymentLink;
      } catch {}
    }

    if (paymentLink) {
      window.location.href = paymentLink;
    } else if (session) {
      // Use the correct Cashfree checkout URL format - uses 'token' not 'orderToken'
      const isProduction = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' || process.env.CASHFREE_ENV === 'production';
      
      // Cashfree expects 'token' parameter for the payment session
      const checkoutUrl = isProduction
        ? `https://www.cashfree.com/checkout/page?token=${encodeURIComponent(session)}`
        : `https://sandbox.cashfree.com/checkout/page?token=${encodeURIComponent(session)}`;
      
      setRedirectUrl(checkoutUrl);
      window.location.href = checkoutUrl;
    } else {
      setError('Payment session not found. Please return to cart and try again.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-xl w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Cashfree</h1>
        <p className="text-gray-700 mb-4">Preparing your secure payment page. Please wait...</p>
        {redirectUrl && (
          <p className="text-sm text-gray-600 mb-4">Opening: <span className="font-mono break-words">{redirectUrl}</span></p>
        )}
        {orderId && (
          <p className="text-sm text-gray-600 mb-4">Order ID: <span className="font-semibold">{orderId}</span></p>
        )}
        {error ? (
          <p className="text-red-600 mb-4">{error}</p>
        ) : (
          <div className="flex items-center justify-center">
            <div className="h-12 w-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        <button
          onClick={() => router.push('/cart')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Cart
        </button>
      </div>
    </div>
  );
}
