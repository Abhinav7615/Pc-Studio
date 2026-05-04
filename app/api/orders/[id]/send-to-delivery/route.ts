import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { createShipmentForOrder } from '@/lib/shipmentHelper';
import { notifyOrderLifecycle } from '@/lib/notificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Find the order
    const order = await Order.findById(orderId).populate('customer', 'name email mobile');
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is in a valid state for shipping
    if (order.status !== 'Payment Verified' && order.status !== 'Order Preparing') {
      return NextResponse.json({ 
        error: 'Order must be in Payment Verified or Order Preparing status to send to delivery partner' 
      }, { status: 400 });
    }

    // Check if shipment already exists
    const existingShipment = await import('@/models/Shipment').then(m => m.default.findOne({ order: order._id }));
    if (existingShipment) {
      return NextResponse.json({ 
        error: 'Shipment already exists for this order',
        trackingId: existingShipment.trackingId,
        deliveryCompanyName: existingShipment.deliveryCompanyName
      }, { status: 400 });
    }

    // Create shipment
    console.log(`Manually creating shipment for order ${order._id}`);
    const shipmentResult = await createShipmentForOrder(order, { priority: 'balance' });

    // Update order status to 'Shipped' and add delivery details
    order.status = 'Shipped';
    order.deliveryCompanyName = shipmentResult.deliveryCompanyName;
    order.trackingId = shipmentResult.trackingId;
    await order.save();

    const shippingInfo = order.shipping
      ? {
          name: order.shipping.name ?? undefined,
          email: order.shipping.email ?? undefined,
          mobile: order.shipping.mobile ?? undefined,
        }
      : undefined;

    await notifyOrderLifecycle({
      _id: order._id?.toString(),
      customerId: order.customer?.toString(),
      orderNumber: order.orderNumber ?? undefined,
      shipping: shippingInfo,
      deliveryCompanyName: order.deliveryCompanyName ?? undefined,
      trackingId: order.trackingId ?? undefined,
    }, 'shipped');

    return NextResponse.json({
      success: true,
      message: 'Order sent to delivery partner successfully',
      trackingId: shipmentResult.trackingId,
      deliveryCompanyName: shipmentResult.deliveryCompanyName,
      awbNumber: shipmentResult.awbNumber,
      shippingCost: shipmentResult.shippingCost
    });

  } catch (error) {
    console.error('Error sending order to delivery partner:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}