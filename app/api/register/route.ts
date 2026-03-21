import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import BusinessSettings from '@/models/BusinessSettings';
import { generateUniqueReferralCode, generateCouponCode } from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { name, email, mobile, password, passwordHint, invitationCode } = await request.json();

    if (!name || !email || !mobile || !password || !passwordHint) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Get business settings for referral bonus amounts
    const settings = await BusinessSettings.findOne();
    const referralCouponAmount = settings?.referralCouponAmount || 100;
    const referralCouponDays = settings?.referralCouponDays || 30;
    const referralCouponUsageLimit = settings?.referralCouponUsageLimit || 1;
    const inviteeDiscountAmount = settings?.inviteeDiscountAmount || 50;
    const inviteeDiscountDays = settings?.inviteeDiscountDays || 30;
    const inviteeDiscountUsageLimit = settings?.inviteeDiscountUsageLimit || 1;

    // Handle invitation code if provided
    let referredBy = null;
    let referrer = null;
    if (invitationCode) {
      referrer = await User.findOne({ referralCode: invitationCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Generate unique referral code for new user using name and mobile
    const referralCode = await generateUniqueReferralCode(name, mobile);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      passwordHint,
      referralCode,
      referredBy,
    });

    await user.save();

    // If referred, create coupons for both inviter and invitee
    if (referrer) {
      const today = new Date();
      const referrerExpirationDate = new Date(today.getTime() + referralCouponDays * 24 * 60 * 60 * 1000);
      const inviteeExpirationDate = new Date(today.getTime() + inviteeDiscountDays * 24 * 60 * 60 * 1000);

      // Coupon for the one who invited (referrer)
      const referrerCouponCode = generateCouponCode();
      const referrerCoupon = new Coupon({
        code: referrerCouponCode,
        discountType: 'fixed',
        discountValue: referralCouponAmount,
        user: referrer._id,
        type: 'referral',
        expirationDays: referralCouponDays,
        expirationDate: referrerExpirationDate,
        usageLimit: referralCouponUsageLimit,
      });
      await referrerCoupon.save();

      // Coupon for the new user (invitee)
      const inviteeCouponCode = generateCouponCode();
      const inviteeCoupon = new Coupon({
        code: inviteeCouponCode,
        discountType: 'fixed',
        discountValue: inviteeDiscountAmount,
        user: user._id,
        type: 'referral',
        expirationDays: inviteeDiscountDays,
        expirationDate: inviteeExpirationDate,
        usageLimit: inviteeDiscountUsageLimit,
      });
      await inviteeCoupon.save();
    }

    return NextResponse.json({
      message: 'User registered successfully',
      referralCode
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

