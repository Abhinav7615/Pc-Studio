import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('No session found in /api/create-order');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }
    if (session.user.role !== 'customer') {
      console.error('Invalid role in /api/create-order:', session.user.role);
      return NextResponse.json({ error: 'Unauthorized - Invalid role' }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body.amount || 0);
    const currency = String(body.currency || 'INR').toUpperCase();
    const receipt = body.receipt ? String(body.receipt).trim() : '';

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Amount must be at least 100 paise' }, { status: 400 });
    }

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt is required' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json(
        {
          error: 'Payment gateway is not configured',
          code: 'PAYMENT_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: true,
    });

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('POST /api/create-order - Razorpay order creation failed:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });
    return NextResponse.json(
      { error: 'Failed to create Razorpay order', details: errorMessage },
      { status: 500 }
    );
  }
}
