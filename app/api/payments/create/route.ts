import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import crypto from 'crypto';

interface CashfreeOrder {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  order_meta: {
    return_url: string;
    notify_url: string;
  };
  order_note?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, orderId: providedOrderId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isTestCredential = appId?.startsWith('TEST') || secretKey?.includes('_test_');
    const defaultEnv = isTestCredential ? 'sandbox' : 'production';
    let environment = process.env.CASHFREE_ENV || defaultEnv;

    if (!appId || !secretKey) {
      console.error('Cashfree credentials not configured');
      return NextResponse.json({ 
        error: 'Payment system not configured. Please contact support.',
        code: 'PAYMENT_NOT_CONFIGURED'
      }, { status: 503 });
    }

    if (environment === 'production' && isTestCredential) {
      console.warn('Cashfree env mismatch: test credentials present while CASHFREE_ENV is production. Forcing sandbox endpoint.');
      environment = 'sandbox';
    }

    // Generate unique order ID
    const orderId = providedOrderId || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get customer details from session
    const customerId = session.user.customerId || session.user.id || 'CUST-' + session.user.email;
    const customerName = session.user.name || 'Customer';
    const customerEmail = session.user.email || '';
    // Mobile will be passed in the request body or we can get it from user data
    const customerPhone = body.customerPhone || '';

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const cashfreeOrder: CashfreeOrder = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${baseUrl}/payment-return?order_id=${orderId}`,
        notify_url: `${baseUrl}/api/payments/webhook`,
      },
      order_note: 'Pc Studio Order Payment',
    };

    const apiUrl = environment === 'production'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
      body: JSON.stringify(cashfreeOrder),
    });

    const responseData = await response.json();

    // DEBUG: Log full Cashfree response for troubleshooting
    console.log('Cashfree API response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      return NextResponse.json({
        error: responseData.message || 'Failed to create payment order',
        details: responseData,
      }, { status: response.status });
    }

    // Construct payment link ourselves if not returned
    const paymentLink = responseData.payment_link || (
      environment === 'production'
        ? `https://www.cashfree.com/checkout/page?token=${responseData.payment_session_id}`
        : `https://sandbox.cashfree.com/checkout/page?token=${responseData.payment_session_id}`
    );

    // Return payment session details to frontend
    return NextResponse.json({
      orderId: orderId,
      paymentSessionId: responseData.payment_session_id,
      cfOrderId: responseData.order_id,
      amount: amount,
      paymentLink: paymentLink,
      orderStatus: responseData.order_status,
      checkoutRedirect: `/payment-redirect?sessionId=${encodeURIComponent(responseData.payment_session_id)}&orderId=${encodeURIComponent(orderId)}`,
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}

// Verify payment status from Cashfree
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isTestCredential = appId?.startsWith('TEST') || secretKey?.includes('_test_');
    const defaultEnv = isTestCredential ? 'sandbox' : 'production';
    let environment = process.env.CASHFREE_ENV || defaultEnv;

    if (!appId || !secretKey) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
    }

    if (environment === 'production' && isTestCredential) {
      console.warn('Cashfree env mismatch: test credentials present while CASHFREE_ENV is production. Forcing sandbox endpoint.');
      environment = 'sandbox';
    }

    const apiUrl = environment === 'production'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const response = await fetch(`${apiUrl}/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to get order status' }, { status: response.status });
    }

    return NextResponse.json({
      orderId: data.order_id,
      orderStatus: data.order_status,
      orderAmount: data.order_amount,
      payments: data.payments,
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}