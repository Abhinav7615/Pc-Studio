import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // Populate user details and product names so admin can see assigned user and products
    const coupons = await Coupon.find({}).sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('products', 'name');
    return NextResponse.json(coupons, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    const couponPayload: Record<string, unknown> = {
      code: body.code?.toUpperCase(),
      discountType: body.discountType,
      discountValue: body.discountValue,
      expirationDays: body.expirationDays,
      expirationHours: body.expirationHours,
      startHour: body.startHour,
      endHour: body.endHour,
      usageLimit: body.usageLimit,
      products: Array.isArray(body.products) ? body.products : [],
    };

    if (body.user) {
      couponPayload.user = body.user;
      couponPayload.type = 'admin';
    }

    const coupon = new Coupon(couponPayload);

    await coupon.save();
    const populatedCoupon = await coupon.populate('user', 'name email');
    return NextResponse.json(populatedCoupon, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Coupon deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {
      code: body.code?.toUpperCase(),
      discountType: body.discountType,
      discountValue: body.discountValue,
      expirationDays: body.expirationDays,
      expirationHours: body.expirationHours,
      startHour: body.startHour,
      endHour: body.endHour,
      usageLimit: body.usageLimit,
      products: Array.isArray(body.products) ? body.products : [],
    };

    if (body.user) {
      updateData.user = body.user;
      updateData.type = 'admin';
    } else {
      updateData.user = null;
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true }).populate('user', 'name email');

    if (!updatedCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCoupon, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}