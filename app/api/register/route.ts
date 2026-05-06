import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Token from '@/models/Token';
import Coupon from '@/models/Coupon';
import BusinessSettings from '@/models/BusinessSettings';
import { generateUniqueReferralCode, generateCouponCode, generateUniqueCustomerId } from '@/lib/referral';
import { verifyFirebaseIdToken } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { name, email, mobile, password, passwordHint, invitationCode, registerToken, firebaseIdToken } = await request.json();

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedMobile = typeof mobile === 'string' ? mobile.trim().replace(/^\+91/, '').replace(/\D/g, '') : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!name || !normalizedEmail || !password || !passwordHint) {
      return NextResponse.json({ error: 'Name, email, password, and password hint are required' }, { status: 400 });
    }

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (normalizedMobile && !mobileRegex.test(normalizedMobile)) {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    if (firebaseIdToken) {
      try {
        const decodedToken = await verifyFirebaseIdToken(firebaseIdToken);
        const tokenPhone = typeof decodedToken.phone_number === 'string' ? decodedToken.phone_number.replace(/^\+/, '') : '';
        const normalizedTokenPhone = tokenPhone.startsWith('91') ? tokenPhone.slice(2) : tokenPhone;
        if (normalizedMobile && normalizedTokenPhone !== normalizedMobile) {
          return NextResponse.json({ error: 'Firebase phone number does not match the provided mobile number' }, { status: 400 });
        }
      } catch (err) {
        console.error('Firebase ID token verification failed:', err);
        return NextResponse.json({ error: 'Invalid Firebase phone verification token' }, { status: 400 });
      }
    } else if (registerToken) {
      const registerInfo = await Token.findOne({ token: registerToken, type: 'register' });
      if (!registerInfo || registerInfo.email !== normalizedEmail || registerInfo.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired registration token. Please verify your OTP again.' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Firebase verification token or register token is required' }, { status: 400 });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, ...(normalizedMobile ? [{ mobile: normalizedMobile }] : [])],
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

    // Generate unique referral code for new user using name and email/mobile
    const referralCode = await generateUniqueReferralCode(name, normalizedMobile || normalizedEmail);

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
    
    // Clean up registration tokens
    if (registerToken) {
      const tokenQuery: any = {
        type: 'register',
        email: normalizedEmail,
      };
      await Token.deleteMany(tokenQuery);
    }

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
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

