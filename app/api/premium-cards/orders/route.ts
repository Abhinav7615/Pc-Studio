import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import CardOrder from '@/models/PremiumCardOrder';
import { notifyAdminsNewPremiumCardOrder } from '@/telegramBot/helpers';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  const orders = await CardOrder.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  await dbConnect();
  const orderId = `PC-${Date.now()}`;
  const order = await CardOrder.create({
    orderId,
    userId: session?.user?.id || body.userId,
    userName: session?.user?.name || body.userName || '',
    userEmail: session?.user?.email || body.userEmail || '',
    userWhatsApp: body.userWhatsApp || '',
    cardId: body.cardId,
    cardName: body.cardName || '',
    categoryName: body.categoryName || '',
    price: Number(body.price || 0),
    paymentScreenshot: body.paymentScreenshot || '',
    utrNumber: body.utrNumber || '',
    transactionId: body.transactionId || '',
    remark: body.remark || '',
    status: 'pending',
  });

  try {
    await notifyAdminsNewPremiumCardOrder(order);
  } catch (error) {
    console.error('Failed to notify admins of new premium card order:', error);
  }
  return NextResponse.json(order);
}
