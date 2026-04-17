import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();

    // Check if referral program is enabled
    const settings = await BusinessSettings.findOne();
    const referralEnabled = settings?.referralEnabled ?? true;

    // Build query to find coupons for this user that are still valid
    // Filter out referral coupons if referral is disabled
    type UserCouponQuery = {
      $and: Array<Record<string, unknown>>;
    };

    const query: UserCouponQuery = {
      $and: [
        {
          $or: [
            { user: session.user.id }
          ]
        },
        {
          $or: [
            { usageLimit: null },
            { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
          ]
        }
      ]
    };

    // If referral is disabled, exclude referral coupons
    if (!referralEnabled) {
      query.$and.push({ type: { $ne: 'referral' } });
    }

    const coupons = await Coupon.find(query).select('code discountType discountValue expirationDays expirationDate createdAt');

    // Filter out expired coupons
    const validCoupons = coupons.filter(coupon => {
      // Use expirationDate if available, otherwise calculate from expirationDays
      if (coupon.expirationDate) {
        return now <= new Date(coupon.expirationDate);
      }
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