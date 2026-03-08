import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const order = await Order.findById(id).populate('customer', 'name email mobile').populate('products.product');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user can view this order
    if (session.user.role === 'customer' && order.customer._id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();

    if (session.user.role === 'customer') {
      // Customer can upload payment details and request returns
      if (body.paymentScreenshot && body.transactionId) {
        order.paymentScreenshot = body.paymentScreenshot;
        order.transactionId = body.transactionId;
      }
      if (body.returnStatus === 'Return Requested' && body.returnReason) {
        order.returnStatus = body.returnStatus;
        order.returnReason = body.returnReason;
      }
    } else if (session.user.role === 'admin' || session.user.role === 'staff') {
      // Admin/staff can update status, return status, and refund status
      if (body.status) {
        order.status = body.status;
      }
      if (body.returnStatus) {
        order.returnStatus = body.returnStatus;
      }
      if (body.refundStatus) {
        order.refundStatus = body.refundStatus;
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await order.save();

    return NextResponse.json(order, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}