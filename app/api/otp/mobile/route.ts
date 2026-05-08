import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendSmsMessage } from '@/lib/sendSms';
import { generateOtp } from '@/lib/msg91Otp';
import { setMobileOtp, getMobileOtp, deleteMobileOtp, cleanupExpiredMobileOtps } from '@/lib/otpStore';

export async function POST(request: NextRequest) {
  try {
    const { action, mobile, otp } = await request.json();

    if (action === 'send') {
      if (!mobile) {
        return NextResponse.json({ error: 'Mobile number required' }, { status: 400 });
      }

      let cleanMobile = mobile.replace(/^\+91/, '').replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number. Please enter 10 digits.' }, { status: 400 });
      }

      await dbConnect();
      // Check if user exists (optional in dev for testing)
      try {
        const existingUser = await User.findOne({ mobile: cleanMobile });
        if (!existingUser) {
          // For dev/testing, allow sending OTP even if user doesn't exist
          console.warn(`Mobile ${cleanMobile} not found in database, but allowing OTP for dev testing`);
        }
      } catch (dbError) {
        console.warn('User lookup failed, continuing with OTP for dev:', dbError);
      }

      const newOtp = generateOtp();
      setMobileOtp(`mobile_${cleanMobile}`, newOtp);

      const smsResult = await sendSmsMessage(
        cleanMobile,
        `Your Refurbished PC Studio OTP is: ${newOtp}. Valid for 10 minutes. Do not share with anyone.`
      );

      if (!smsResult.success) {
        console.error('OTP send failed:', smsResult.message);
        return NextResponse.json(
          { error: `Failed to send OTP: ${smsResult.message}` },
          { status: 500 }
        );
      }

      cleanupExpiredMobileOtps();

      return NextResponse.json(
        {
          message: smsResult.provider === 'dev'
            ? 'OTP generated for development. Check the server console or debug info.'
            : 'OTP sent to your mobile',
          maskedMobile: `XXXXXX${cleanMobile.slice(-4)}`,
          debugOtp: smsResult.provider === 'dev' ? newOtp : undefined,
          debugSms: smsResult.debugSms,
        },
        { status: 200 }
      );
    }

    if (action === 'verify') {
      if (!mobile || !otp) {
        return NextResponse.json({ error: 'Mobile number and OTP are required' }, { status: 400 });
      }

      let cleanMobile = mobile.replace(/^\+91/, '').replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number. Please enter 10 digits.' }, { status: 400 });
      }

      const key = `mobile_${cleanMobile}`;
      const storedData = getMobileOtp(key);
      if (!storedData) {
        return NextResponse.json({ error: 'OTP expired or invalid. Please request a new OTP.' }, { status: 400 });
      }

      if (new Date() > storedData.expiresAt) {
        deleteMobileOtp(key);
        return NextResponse.json({ error: 'OTP has expired. Please request a new OTP.' }, { status: 400 });
      }

      if (storedData.attempts >= 3) {
        deleteMobileOtp(key);
        return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 });
      }

      if (storedData.otp !== otp) {
        storedData.attempts++;
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }

      deleteMobileOtp(key);

      const user = await User.findOne({ mobile: cleanMobile });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(
        {
          message: 'OTP verified successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Mobile OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
