import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await dbConnect();
    const { code, total } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json({ error: 'Valid total required' }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Check if coupon belongs to a specific user and if current user can use it
    if (coupon.user) {
      if (!session) {
        return NextResponse.json({ error: 'Please login to use this coupon' }, { status: 401 });
      }
      if (coupon.user.toString() !== session.user.id) {
        return NextResponse.json({ error: 'This coupon is not available for your account' }, { status: 403 });
      }
    }

    const now = new Date();
    const createdAt = new Date(coupon.createdAt);

    // Check expiration days
    if (coupon.expirationDays) {
      const expiryDate = new Date(createdAt.getTime() + coupon.expirationDays * 24 * 60 * 60 * 1000);
      if (now > expiryDate) {
        return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
      }
    }

    // Check expiration hours
    if (coupon.expirationHours) {
      const expiryTime = new Date(createdAt.getTime() + coupon.expirationHours * 60 * 60 * 1000);
      if (now > expiryTime) {
        return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
      }
    }

    // Check time range
    if (coupon.startHour !== null && coupon.endHour !== null) {
      const currentHour = now.getHours();
      if (currentHour < coupon.startHour || currentHour > coupon.endHour) {
        return NextResponse.json({ error: 'Coupon not valid at this time' }, { status: 400 });
      }
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon usage limit exceeded' }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (total * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    return NextResponse.json({ discount }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}