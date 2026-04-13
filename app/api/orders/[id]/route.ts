import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate('customer', 'name email mobile').populate('products.product');
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id }).populate('customer', 'name email mobile').populate('products.product');
    }

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
      // Customer can upload payment details, request returns, and request cancellations
      if (body.paymentScreenshot && body.transactionId) {
        order.paymentScreenshot = body.paymentScreenshot;
        order.transactionId = body.transactionId;
      }
      if (body.returnStatus === 'Return Requested' && body.returnReason) {
        order.returnStatus = body.returnStatus;
        order.returnReason = body.returnReason;
      }
      if (body.cancellationStatus === 'Cancellation Requested' && body.cancellationReason) {
        order.cancellationStatus = body.cancellationStatus;
        order.cancellationReason = body.cancellationReason;
      }
    } else if (session.user.role === 'admin' || session.user.role === 'staff') {
      // Admin/staff can update status, return status, refund status, cancellation status, and delivery details
      if (body.status) {
        order.status = body.status;
        if (body.status === 'Delivered') {
          order.deliveryDate = new Date();
          order.returnDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        }
      }
      if (body.returnStatus) {
        order.returnStatus = body.returnStatus;
      }
      if (body.refundStatus) {
        order.refundStatus = body.refundStatus;
      }
      if (body.cancellationStatus) {
        order.cancellationStatus = body.cancellationStatus;
        if (body.cancellationStatus === 'Cancellation Approved') {
          order.status = 'Order Rejected';
        }
      }
      if (body.deliveryCompanyName !== undefined) {
        order.deliveryCompanyName = String(body.deliveryCompanyName).trim();
      }
      if (body.deliveryCompanyDetails !== undefined) {
        order.deliveryCompanyDetails = String(body.deliveryCompanyDetails).trim();
      }
      if (body.trackingId !== undefined) {
        order.trackingId = String(body.trackingId).trim();
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow deletion of cancelled or rejected orders
    if (order.status !== 'Order Rejected' && order.cancellationStatus !== 'Cancellation Approved') {
      return NextResponse.json({ error: 'Only cancelled or rejected orders can be deleted' }, { status: 400 });
    }

    await Order.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}