import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import CardOrder from '@/models/PremiumCardOrder';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  let userId = searchParams.get('userId');
  if (!userId && session?.user?.id) {
    userId = session.user.id;
  }
  if (!userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff' && session?.user?.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  const orders = await CardOrder.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(orders);
}
