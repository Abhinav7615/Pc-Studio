import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendSmsMessage } from '@/lib/sendSms';
import { generateOtp, getOtpExpiry } from '@/lib/msg91Otp';

// Store mobile OTPs temporarily (in production, use Redis or similar)
const mobileOtpStore: { [key: string]: { otp: string; expiresAt: Date; attempts: number } } = {};

export async function POST(request: NextRequest) {
  try {
    const { action, mobile, otp, otpKey } = await request.json();

    if (action === 'send') {
      if (!mobile) {
        return NextResponse.json({ error: 'Mobile number required' }, { status: 400 });
      }

      // Clean and validate mobile number
      let cleanMobile = mobile.replace(/^\+91/, '').replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number. Please enter 10 digits.' }, { status: 400 });
      }

      // Check if user exists with this mobile (for login/register scenarios)
      await dbConnect();
      const existingUser = await User.findOne({ mobile: cleanMobile });
      if (!existingUser) {
        return NextResponse.json({ error: 'No account found with this mobile number' }, { status: 404 });
      }

      // Generate OTP
      const newOtp = generateOtp();
      const expiresAt = getOtpExpiry();

      // Store OTP with mobile verification key
      const key = `mobile_${cleanMobile}_${Date.now()}`;
      mobileOtpStore[key] = {
        otp: newOtp,
        expiresAt,
        attempts: 0,
      };

      // Send OTP via configured SMS provider
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

      // Clean up expired OTPs
      cleanupExpiredOtps();

      return NextResponse.json(
        {
          message: 'OTP sent to your mobile',
          otpKey: key,
          maskedMobile: `XXXXXX${cleanMobile.slice(-4)}`,
        },
        { status: 200 }
      );
    }

    if (action === 'verify') {
      if (!otp || !otpKey) {
        return NextResponse.json({ error: 'OTP and OTP key required' }, { status: 400 });
      }

      const storedData = mobileOtpStore[otpKey];
      if (!storedData) {
        return NextResponse.json({ error: 'OTP expired or invalid. Please request a new OTP.' }, { status: 400 });
      }

      // Check if OTP is expired
      if (new Date() > storedData.expiresAt) {
        delete mobileOtpStore[otpKey];
        return NextResponse.json({ error: 'OTP has expired. Please request a new OTP.' }, { status: 400 });
      }

      // Check attempts
      if (storedData.attempts >= 3) {
        delete mobileOtpStore[otpKey];
        return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 });
      }

      // Verify OTP
      if (storedData.otp !== otp) {
        storedData.attempts++;
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }

      // OTP verified successfully
      delete mobileOtpStore[otpKey];

      // Extract mobile from key for user lookup
      const mobileMatch = otpKey.match(/mobile_(\d{10})_/);
      if (!mobileMatch) {
        return NextResponse.json({ error: 'Invalid OTP key' }, { status: 400 });
      }

      const mobileNumber = mobileMatch[1];
      const user = await User.findOne({ mobile: mobileNumber });

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

function cleanupExpiredOtps() {
  const now = new Date();
  Object.keys(mobileOtpStore).forEach(key => {
    if (now > mobileOtpStore[key].expiresAt) {
      delete mobileOtpStore[key];
    }
  });
}

// Clean up expired OTPs every 5 minutes
setInterval(cleanupExpiredOtps, 5 * 60 * 1000);
