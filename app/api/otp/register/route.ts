import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Token from '@/models/Token';
import { sendOtpEmail } from '@/lib/sendEmail';
import {
  generateOtp,
  setRegisterOtp,
  getRegisterOtp,
  deleteRegisterOtp,
  generateSecureToken,
} from '@/lib/otpStore';

export async function POST(request: NextRequest) {
  try {
    const { action, email, otp } = await request.json();

    if (action === 'send') {
      if (!email) {
        return NextResponse.json({ error: 'Email address required' }, { status: 400 });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }

      const emailOtpValue = generateOtp();
      const emailOtpKey = `register_email_${normalizedEmail}`;
      setRegisterOtp(emailOtpKey, emailOtpValue);

      const emailResult = await sendOtpEmail(normalizedEmail, emailOtpValue);
      if (!emailResult.success) {
        console.error('[OTP REGISTER] sendOtpEmail failed', emailResult);
        return NextResponse.json({ error: `Failed to send OTP: ${emailResult.message}` }, { status: 500 });
      }

      return NextResponse.json({
        message: 'OTP sent to your email address',
        email: normalizedEmail,
      }, { status: 200 });
    }

    if (action === 'verify') {
      if (!email) {
        return NextResponse.json({ error: 'Email address required' }, { status: 400 });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }

      const emailOtpValue = (typeof otp === 'string' && otp.trim()) ? otp : '';
      if (!emailOtpValue) {
        return NextResponse.json({ error: 'OTP required' }, { status: 400 });
      }

      const emailOtpKey = `register_email_${normalizedEmail}`;
      const storedEmailOtp = getRegisterOtp(emailOtpKey);
      if (!storedEmailOtp) {
        return NextResponse.json({ error: 'No OTP found. Please request a new OTP.' }, { status: 400 });
      }

      if (storedEmailOtp.expiresAt < new Date()) {
        deleteRegisterOtp(emailOtpKey);
        return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
      }

      if (storedEmailOtp.attempts >= 3) {
        deleteRegisterOtp(emailOtpKey);
        return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 400 });
      }

      if (storedEmailOtp.otp !== emailOtpValue) {
        storedEmailOtp.attempts += 1;
        setRegisterOtp(emailOtpKey, storedEmailOtp.otp, storedEmailOtp.attempts);
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }

      deleteRegisterOtp(emailOtpKey);

      await dbConnect();
      const registerToken = generateSecureToken();
      await Token.create({
        token: registerToken,
        type: 'register',
        email: normalizedEmail,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      return NextResponse.json({
        message: 'Email verified successfully',
        registerToken,
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OTP register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}