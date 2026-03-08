import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateUniqueReferralCode } from '@/lib/referral';

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

    // Handle invitation code if provided
    let referredBy = null;
    if (invitationCode) {
      const referrer = await User.findOne({ referralCode: invitationCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Generate unique referral code for new user
    const referralCode = await generateUniqueReferralCode();

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

    return NextResponse.json({
      message: 'User registered successfully',
      referralCode
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
