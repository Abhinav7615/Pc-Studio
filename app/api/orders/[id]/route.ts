import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { cancelShipmentForOrder } from '@/lib/shipmentHelper';
import { createNotification } from '@/lib/notifications';
import { notifyOrderLifecycle } from '@/lib/notificationService';
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
    const _previousStatus = order.status;
    const previousDeliveryCompanyName = order.deliveryCompanyName || '';
    const previousDeliveryCompanyDetails = order.deliveryCompanyDetails || '';
    const previousTrackingId = order.trackingId || '';
    const deliveryFieldsUpdated: string[] = [];
    let statusChanged = false;
    let shouldCancelShipment = false;
    let lifecycleEvent: import('@/lib/notificationService').OrderLifecycleEvent | null = null;
    let returnLifecycleEvent: import('@/lib/notificationService').OrderLifecycleEvent | null = null;
    let refundLifecycleEvent: import('@/lib/notificationService').OrderLifecycleEvent | null = null;

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
        await createNotification({
          type: 'cancellation-request',
          message: `Cancellation requested for order ${order.orderNumber}`,
          userId: null,
          meta: { orderId: order._id.toString(), customerId: session.user.id },
        });
      }
      if (body.modificationRequest === 'Requested' && body.modificationReason) {
        order.modificationRequest = {
          status: 'Requested',
          reason: String(body.modificationReason).trim(),
        };
        await createNotification({
          type: 'modification-request',
          message: `Modification requested for order ${order.orderNumber}`,
          userId: null,
          meta: { orderId: order._id.toString(), customerId: session.user.id },
        });
      }
    } else if (session.user.role === 'admin' || session.user.role === 'staff') {
      // Admin/staff can update status, return status, refund status, cancellation status, and delivery details
      if (body.status && body.status !== order.status) {
        order.status = body.status;
        statusChanged = true;
        if (body.status === 'Delivered') {
          order.deliveryDate = new Date();
          order.returnDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
          lifecycleEvent = 'delivered';
        }
        if (body.status === 'Order Rejected') {
          shouldCancelShipment = true;
          lifecycleEvent = 'cancelled';
        }
        if (body.status === 'Shipped') {
          lifecycleEvent = 'shipped';
        }
        if (body.status === 'Payment Verified') {
          lifecycleEvent = 'payment-success';
        }
      }
      if (body.returnStatus && body.returnStatus !== order.returnStatus) {
        order.returnStatus = body.returnStatus;
        if (body.returnStatus === 'Return Requested') {
          returnLifecycleEvent = 'return-requested';
        }
        if (body.returnStatus === 'Return Approved') {
          returnLifecycleEvent = 'return-approved';
        }
        if (body.returnStatus === 'Return Rejected') {
          returnLifecycleEvent = 'return-rejected';
        }
        if (body.returnStatus === 'Return Received') {
          returnLifecycleEvent = 'return-received';
        }
      }
      if (body.refundStatus && body.refundStatus !== order.refundStatus) {
        order.refundStatus = body.refundStatus;
        if (body.refundStatus === 'Refund Processed') {
          refundLifecycleEvent = 'refund-processed';
        }
      }
      if (body.cancellationStatus) {
        order.cancellationStatus = body.cancellationStatus;
        if (body.cancellationStatus === 'Cancellation Approved') {
          order.status = 'Order Rejected';
          statusChanged = true;
          shouldCancelShipment = true;
          lifecycleEvent = 'cancelled';
        }
        if (body.cancellationStatus === 'Cancellation Rejected') {
          statusChanged = true;
        }
      }
      if (body.deliveryCompanyName !== undefined && String(body.deliveryCompanyName).trim() !== previousDeliveryCompanyName) {
        order.deliveryCompanyName = String(body.deliveryCompanyName).trim();
        deliveryFieldsUpdated.push('Courier name');
      }
      if (body.deliveryCompanyDetails !== undefined && String(body.deliveryCompanyDetails).trim() !== previousDeliveryCompanyDetails) {
        order.deliveryCompanyDetails = String(body.deliveryCompanyDetails).trim();
        deliveryFieldsUpdated.push('Delivery details');
      }
      if (body.trackingId !== undefined && String(body.trackingId).trim() !== previousTrackingId) {
        order.trackingId = String(body.trackingId).trim();
        deliveryFieldsUpdated.push('Tracking ID');
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await order.save();

    if (shouldCancelShipment) {
      try {
        await cancelShipmentForOrder(order, { reason: 'Order rejected or cancellation approved' });
      } catch (cancelError) {
        console.error('Failed to cancel shipment for rejected order:', cancelError);
      }
    }

    const customerId = order.customer?.toString();
    const shippingInfo = order.shipping
      ? {
          name: order.shipping.name ?? undefined,
          email: order.shipping.email ?? undefined,
          mobile: order.shipping.mobile ?? undefined,
        }
      : undefined;

    if (customerId) {
      if (lifecycleEvent) {
        await notifyOrderLifecycle({
          _id: order._id?.toString(),
          orderNumber: order.orderNumber ?? undefined,
          shipping: shippingInfo,
          deliveryCompanyName: order.deliveryCompanyName ?? undefined,
          trackingId: order.trackingId ?? undefined,
          customerId,
        }, lifecycleEvent);
      }
      if (returnLifecycleEvent) {
        await notifyOrderLifecycle({
          _id: order._id?.toString(),
          orderNumber: order.orderNumber ?? undefined,
          shipping: shippingInfo,
          deliveryCompanyName: order.deliveryCompanyName ?? undefined,
          trackingId: order.trackingId ?? undefined,
          customerId,
        }, returnLifecycleEvent);
      }
      if (refundLifecycleEvent) {
        await notifyOrderLifecycle({
          _id: order._id?.toString(),
          orderNumber: order.orderNumber ?? undefined,
          shipping: shippingInfo,
          deliveryCompanyName: order.deliveryCompanyName ?? undefined,
          trackingId: order.trackingId ?? undefined,
          customerId,
        }, refundLifecycleEvent);
      }
      if (statusChanged && !lifecycleEvent) {
        await createNotification({
          userId: customerId,
          type: 'order-status',
          message: `Order ${order.orderNumber} status updated to ${order.status}.`,
          meta: { orderId: order._id.toString() },
        });
      }
      if (deliveryFieldsUpdated.length > 0) {
        await createNotification({
          userId: customerId,
          type: 'order-status',
          message: `Delivery info for order ${order.orderNumber} updated: ${deliveryFieldsUpdated.join(', ')}.`,
          meta: { orderId: order._id.toString() },
        });
      }
    }

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