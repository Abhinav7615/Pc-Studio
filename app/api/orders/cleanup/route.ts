import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const thresholdValue = Number(body.thresholdValue);
    const thresholdUnit = body.thresholdUnit === 'years' ? 'years' : 'months';

    if (!thresholdValue || thresholdValue <= 0) {
      return NextResponse.json({ error: 'Invalid threshold value' }, { status: 400 });
    }

    const cutoffDate = new Date();
    if (thresholdUnit === 'years') {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - thresholdValue);
    } else {
      cutoffDate.setMonth(cutoffDate.getMonth() - thresholdValue);
    }

    const result = await Order.deleteMany({ createdAt: { $lt: cutoffDate } });

    return NextResponse.json({
      deletedCount: result.deletedCount ?? 0,
      cutoffDate: cutoffDate.toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('Order cleanup failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
