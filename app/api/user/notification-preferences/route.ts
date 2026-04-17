import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select('notificationPreferences');
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ notificationPreferences: user.notificationPreferences || {} }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const body = await request.json();
  const preferences = body.notificationPreferences;

  if (!preferences || typeof preferences !== 'object') {
    return NextResponse.json({ error: 'Notification preferences must be provided' }, { status: 400 });
  }

  const allowedKeys = ['orderUpdates', 'bargain', 'outbid', 'auction', 'adminMessages'];
  const updatePayload: any = {};

  Object.entries(preferences).forEach(([key, value]) => {
    if (allowedKeys.includes(key) && typeof value === 'boolean') {
      updatePayload[`notificationPreferences.${key}`] = value;
    }
  });

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No valid notification preferences provided' }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(session.user.id, { $set: updatePayload }, { new: true }).select('notificationPreferences');
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ notificationPreferences: user.notificationPreferences || {}, message: 'Notification preferences updated' }, { status: 200 });
}
