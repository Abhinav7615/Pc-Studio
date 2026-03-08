import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();

    // Find coupons for this user that are still valid
    const coupons = await Coupon.find({
      user: session.user.id,
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    }).select('code discountType discountValue expirationDays createdAt');

    // Filter out expired coupons
    const validCoupons = coupons.filter(coupon => {
      if (coupon.expirationDays) {
        const createdAt = new Date(coupon.createdAt);
        const expiryDate = new Date(createdAt.getTime() + coupon.expirationDays * 24 * 60 * 60 * 1000);
        return now <= expiryDate;
      }
      return true;
    });

    return NextResponse.json(validCoupons, { status: 200 });
  } catch (error) {
    console.error('Error fetching user coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}