import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import connectDB from '../../../lib/mongodb';
import CourierPartner from '../../../models/CourierPartner';
import CourierRoutingEngine from '../../../lib/courierRoutingEngine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const query = activeOnly ? { isActive: true } : {};

    const couriers = await CourierPartner.find(query).sort({ name: 1 });

    // Get performance metrics for each courier
    const routingEngine = CourierRoutingEngine.getInstance();
    const couriersWithMetrics = await Promise.all(
      couriers.map(async (courier) => {
        const metrics = await routingEngine.getCourierMetrics(courier._id);
        return {
          ...courier.toObject(),
          metrics
        };
      })
    );

    return NextResponse.json({ couriers: couriersWithMetrics });

  } catch (error) {
    console.error('Error fetching couriers:', error);
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
    const {
      name,
      code,
      apiKey,
      apiSecret,
      baseUrl,
      isActive = true,
      supportsCOD = true,
      supportsPrepaid = true,
      maxWeightKg = 30,
      minWeightKg = 0.1,
      baseRate,
      additionalRate = 0,
      codChargePercent = 0,
      fuelSurchargePercent = 0,
      serviceablePincodes = [],
      zonePricing = {},
      successRate = 95,
      averageDeliveryDays = 3,
      rtoRate = 5,
      webhookUrl,
      webhookSecret
    } = body;

    // Validate required fields
    if (!name || !code || !apiKey || !baseUrl || !baseRate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if courier code already exists
    const existingCourier = await CourierPartner.findOne({ code });
    if (existingCourier) {
      return NextResponse.json({ error: 'Courier code already exists' }, { status: 400 });
    }

    const courier = new CourierPartner({
      name,
      code,
      apiKey,
      apiSecret,
      baseUrl,
      isActive,
      supportsCOD,
      supportsPrepaid,
      maxWeightKg,
      minWeightKg,
      baseRate,
      additionalRate,
      codChargePercent,
      fuelSurchargePercent,
      serviceablePincodes,
      zonePricing,
      successRate,
      averageDeliveryDays,
      rtoRate,
      webhookUrl,
      webhookSecret
    });

    await courier.save();

    return NextResponse.json({
      courier,
      message: 'Courier partner added successfully'
    });

  } catch (error) {
    console.error('Error creating courier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}