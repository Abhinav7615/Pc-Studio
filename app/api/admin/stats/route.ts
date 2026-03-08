import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const totalOrders = await Order.countDocuments();
    const pendingPayments = await Order.countDocuments({ status: 'Payment Pending' });
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();

    return NextResponse.json({ totalOrders, pendingPayments, totalProducts, totalUsers }, { status: 200 });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
