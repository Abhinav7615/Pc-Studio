import { NextRequest, NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/sendEmail';
import { generateOtp, getOtpExpiry } from '@/lib/msg91Otp';

// Store OTPs temporarily
const otpStore: { [key: string]: { otp: string; expiresAt: Date; attempts: number } } = {};

export async function POST(request: NextRequest) {
  try {
    const { action, email, otp, otpKey } = await request.json();

    if (action === 'send') {
      // Send OTP for order placement
      if (!email) {
        return NextResponse.json({ error: 'Email address required' }, { status: 400 });
      }

      // Generate OTP
      const newOtp = generateOtp();
      const expiresAt = getOtpExpiry();

      // Store OTP with email verification key
      const key = `order_${email}_${Date.now()}`;
      otpStore[key] = {
        otp: newOtp,
        expiresAt,
        attempts: 0,
      };

      // Send OTP via Email
      const emailSent = await sendOtpEmail(email, newOtp);

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send OTP. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          message: 'OTP sent to your email',
          otpKey: key,
          maskedEmail: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        },
        { status: 200 }
      );
    } else if (action === 'verify') {
      // Verify OTP for order placement
      if (!otp || !otpKey) {
        return NextResponse.json({ error: 'OTP and OTP key required' }, { status: 400 });
      }

      const storedOtp = otpStore[otpKey];

      if (!storedOtp) {
        return NextResponse.json(
          { error: 'OTP expired or not sent. Please request a new OTP.' },
          { status: 400 }
        );
      }

      if (storedOtp.expiresAt < new Date()) {
        delete otpStore[otpKey];
        return NextResponse.json(
          { error: 'OTP expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (storedOtp.attempts >= 3) {
        delete otpStore[otpKey];
        return NextResponse.json(
          { error: 'Too many attempts. Please request a new OTP.' },
          { status: 400 }
        );
      }

      if (storedOtp.otp !== otp.trim()) {
        storedOtp.attempts += 1;
        return NextResponse.json(
          {
            error: `Invalid OTP. ${3 - storedOtp.attempts} attempts remaining.`,
          },
          { status: 400 }
        );
      }

      // OTP verified successfully
      delete otpStore[otpKey];

      return NextResponse.json(
        {
          message: 'Email verified successfully',
          verified: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Order OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
