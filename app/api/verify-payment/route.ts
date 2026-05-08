import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const razorpayPaymentId = body.razorpay_payment_id ? String(body.razorpay_payment_id).trim() : '';
    const razorpayOrderId = body.razorpay_order_id ? String(body.razorpay_order_id).trim() : '';
    const razorpaySignature = body.razorpay_signature ? String(body.razorpay_signature).trim() : '';
    const orderId = body.orderId ? String(body.orderId).trim() : '';

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('Razorpay secret key not configured');
      return NextResponse.json({ error: 'Payment gateway is not configured' }, { status: 503 });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    await dbConnect();

    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        order = await Order.findOne({ orderNumber: orderId });
      }
    }

    if (!order) {
      order = await Order.findOne({ razorpayOrderId: razorpayOrderId });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.status = 'Payment Verified';
    order.paymentVerifiedAt = new Date();
    order.paymentDetails = {
      gateway: 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    };

    await order.save();

    return NextResponse.json({ success: true, orderId: order._id });
  } catch (error) {
    console.error('POST /api/verify-payment - Razorpay verification failed:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
