import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import BusinessSettings from '@/models/BusinessSettings';
import { generateUniqueReferralCode, generateCouponCode, generateUniqueCustomerId } from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { name, email, mobile, password, passwordHint, invitationCode, registerToken } = await request.json();

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedMobile = typeof mobile === 'string' ? mobile.trim() : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;

    if (!name || !normalizedEmail || !normalizedMobile || !password || !passwordHint || !registerToken) {
      return NextResponse.json({ error: 'All fields and register token are required' }, { status: 400 });
    }

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!mobileRegex.test(normalizedMobile)) {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    const { getRegisterToken, deleteRegisterToken } = await import('@/lib/otpStore');
    const registerInfo = getRegisterToken(registerToken);
    if (!registerInfo || registerInfo.email !== normalizedEmail || registerInfo.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired registration token' }, { status: 400 });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Get business settings for referral bonus amounts
    const settings = await BusinessSettings.findOne();
    const referralEnabled = settings?.referralEnabled ?? true;
    const referralCouponAmount = settings?.referralCouponAmount || 100;
    const referralCouponDays = settings?.referralCouponDays || 30;
    const referralCouponUsageLimit = settings?.referralCouponUsageLimit || 1;
    const inviteeDiscountAmount = settings?.inviteeDiscountAmount || 50;
    const inviteeDiscountDays = settings?.inviteeDiscountDays || 30;
    const inviteeDiscountUsageLimit = settings?.inviteeDiscountUsageLimit || 1;

    // Handle invitation code if provided (only if referral program is enabled)
    let referredBy = null;
    let referrer = null;
    if (invitationCode && referralEnabled) {
      referrer = await User.findOne({ referralCode: invitationCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Generate unique referral code for new user using name and mobile
    const referralCode = await generateUniqueReferralCode(name, mobile);

    const hashedPassword = await bcrypt.hash(password, 12);

    const customerId = await generateUniqueCustomerId();

    const user = new User({
      name,
      email: normalizedEmail,
      mobile: normalizedMobile,
      password: hashedPassword,
      passwordHint,
      referralCode,
      referredBy,
      customerId,
    });

    await user.save();
    deleteRegisterToken(registerToken);

    // If referred and referral program is enabled, create coupons for both inviter and invitee
    let inviteeCouponCode = null;
    let inviteeCouponAmount = null;
    if (referrer && referralEnabled) {
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
      inviteeCouponCode = generateCouponCode();
      inviteeCouponAmount = inviteeDiscountAmount;
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
      referralCode,
      inviteeCouponCode,
      inviteeCouponAmount,
      inviteeDiscountReceived: !!inviteeCouponCode,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

