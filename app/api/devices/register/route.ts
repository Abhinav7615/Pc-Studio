import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Device from '@/models/Device';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { fcmToken, subscription, platform } = body;
  if (!fcmToken && !subscription) {
    return NextResponse.json({ error: 'fcmToken or subscription is required' }, { status: 400 });
  }

  await dbConnect();

  try {
    // Upsert by token or subscription endpoint
    const deviceQuery: any = { user: session.user.id };
    if (fcmToken) deviceQuery.fcmToken = fcmToken;
    if (subscription && subscription.endpoint) deviceQuery['webPushSubscription.endpoint'] = subscription.endpoint;

    const update: any = { platform: platform || 'web', lastSeen: new Date() };
    if (fcmToken) update.fcmToken = fcmToken;
    if (subscription) update.webPushSubscription = subscription;

    const device = await Device.findOneAndUpdate(deviceQuery, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    return NextResponse.json({ device }, { status: 200 });
  } catch (error) {
    console.error('POST /api/devices/register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
