import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Shipment from '../../../models/Shipment';
import CourierPartner from '../../../models/CourierPartner';
import { createShipmentForOrder } from '../../../lib/shipmentHelper';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const courier = searchParams.get('courier');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const query: any = {};
    if (status) query.status = status;
    if (courier) query.courierCode = courier;

    const shipments = await Shipment.find(query)
      .populate('order')
      .populate('courierPartner')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Shipment.countDocuments(query);

    return NextResponse.json({
      shipments,
      total,
      pagination: {
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { orderId, priority = 'balance', manualCourierId } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Find by ObjectId or orderNumber to support both admin input methods
    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate('customer');
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: orderId }).populate('customer');
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if shipment already exists
    const existingShipment = await Shipment.findOne({ order: order._id });
    if (existingShipment) {
      return NextResponse.json({ error: 'Shipment already exists for this order' }, { status: 400 });
    }

    // Create shipment with courier
    const shipment = await createShipmentForOrder(order, { priority, manualCourierId });

    return NextResponse.json({
      shipment,
      message: 'Shipment created successfully'
    });

  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

