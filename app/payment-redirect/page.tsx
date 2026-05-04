'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PaymentRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = searchParams.get('sessionId') || '';

  useEffect(() => {
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
      
      window.location.href = checkoutUrl;
    } else {
      router.push('/cart?error=payment_session_not_found');
    }
  }, [searchParams, router, session]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to payment...</p>
      </div>
    </div>
  );
}
