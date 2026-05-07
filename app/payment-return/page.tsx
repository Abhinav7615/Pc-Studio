'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface PaymentStatus {
  orderId: string;
  status: 'success' | 'failed' | 'pending' | 'processing' | 'error';
  message: string;
  amount?: number;
  transactionId?: string;
}

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPaymentStatus() {
      const orderId = searchParams?.get('order_id');
      const cfOrderId = searchParams?.get('cf_order_id');
      const status = searchParams?.get('status');
      const txStatus = searchParams?.get('txStatus');

      if (!orderId && !cfOrderId) {
        setPaymentStatus({
          orderId: '',
          status: 'error',
          message: 'No order information received',
        });
        setLoading(false);
        return;
      }

      const finalOrderId = orderId || cfOrderId || '';

      // Check payment status from Cashfree
      try {
        const response = await fetch(`/api/payments/create?orderId=${finalOrderId}`);
        const data = await response.json();

        if (response.ok && data.orderStatus) {
          let paymentStatus: 'success' | 'failed' | 'pending' | 'processing' | 'error' = 'error';
          let message = '';

          switch (data.orderStatus) {
            case 'PAID':
            case 'captured':
              paymentStatus = 'success';
              message = 'Payment successful! Your order is confirmed.';
              break;
            case 'ACTIVE':
            case 'pending':
              paymentStatus = 'pending';
              message = 'Payment is being processed. You will be notified once confirmed.';
              break;
            case 'FAILED':
            case 'failed':
              paymentStatus = 'failed';
              message = 'Payment failed. Please try again or use alternative payment method.';
              break;
            case 'EXPIRED':
              paymentStatus = 'error';
              message = 'Payment session expired. Please try again.';
              break;
            default:
              paymentStatus = 'processing';
              message = 'Processing your payment...';
          }

          setPaymentStatus({
            orderId: finalOrderId,
            status: paymentStatus,
            message,
            amount: data.orderAmount,
            transactionId: data.payments?.[0]?.cf_payment_id,
          });
        } else {
          // Fallback: check URL parameters
          if (txStatus === 'SUCCESS' || status === 'SUCCESS') {
            setPaymentStatus({
              orderId: finalOrderId,
              status: 'success',
              message: 'Payment successful! Your order is confirmed.',
            });
          } else if (txStatus === 'FAILED' || status === 'FAILED') {
            setPaymentStatus({
              orderId: finalOrderId,
              status: 'failed',
              message: 'Payment failed. Please try again.',
            });
          } else {
            setPaymentStatus({
              orderId: finalOrderId,
              status: 'error',
              message: data.error || 'Unable to verify payment status',
            });
          }
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
        
        // Fallback to URL parameters
        if (txStatus === 'SUCCESS' || status === 'SUCCESS') {
          setPaymentStatus({
            orderId: finalOrderId,
            status: 'success',
            message: 'Payment successful! Your order is confirmed.',
          });
        } else if (txStatus === 'FAILED' || status === 'FAILED') {
          setPaymentStatus({
            orderId: finalOrderId,
            status: 'failed',
            message: 'Payment failed. Please try again.',
          });
        } else {
          setPaymentStatus({
            orderId: finalOrderId,
            status: 'error',
            message: 'Unable to verify payment. Please check your orders.',
          });
        }
      }

      setLoading(false);
    }

    checkPaymentStatus();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Verifying Payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
          <button
            onClick={() => router.push('/cart')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    success: {
      icon: '✅',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
    },
    failed: {
      icon: '❌',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
    },
    pending: {
      icon: '⏳',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
    },
    processing: {
      icon: '🔄',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
    },
    error: {
      icon: '⚠️',
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
    },
  };

  const config = statusConfig[paymentStatus.status] || statusConfig.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className={`max-w-md w-full ${config.bgColor} border ${config.borderColor} rounded-lg p-8 shadow-lg`}>
        <div className="text-center">
          <div className="text-6xl mb-4">{config.icon}</div>
          <h2 className={`text-2xl font-bold text-${config.color}-800 mb-2`}>
            {paymentStatus.status === 'success' && 'Payment Successful!'}
            {paymentStatus.status === 'failed' && 'Payment Failed'}
            {paymentStatus.status === 'pending' && 'Payment Pending'}
            {paymentStatus.status === 'processing' && 'Processing Payment'}
            {paymentStatus.status === 'error' && 'Payment Error'}
          </h2>
          <p className="text-gray-700 mb-4">{paymentStatus.message}</p>
          
          {paymentStatus.orderId && (
            <div className="text-sm text-gray-600 mb-4">
              <p>Order ID: <span className="font-mono font-semibold">{paymentStatus.orderId}</span></p>
              {paymentStatus.transactionId && (
                <p>Transaction ID: <span className="font-mono">{paymentStatus.transactionId}</span></p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-6">
            {paymentStatus.status === 'success' ? (
              <>
                <button
                  onClick={() => router.push(`/order-success?orderId=${paymentStatus.orderId}`)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                >
                  View Order Details
                </button>
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Go to My Orders
                </button>
              </>
            ) : paymentStatus.status === 'failed' || paymentStatus.status === 'error' ? (
              <>
                <button
                  onClick={() => router.push('/cart')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  View My Orders
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Check Order Status
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Go to Home
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If you have any questions, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}