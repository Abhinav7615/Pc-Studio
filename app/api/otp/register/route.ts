import { NextRequest, NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/sendEmail';
import {
  generateOtp,
  setRegisterOtp,
  getRegisterOtp,
  deleteRegisterOtp,
  generateSecureToken,
  setRegisterToken,
} from '@/lib/otpStore';

export async function POST(request: NextRequest) {
  try {
    const { action, email, otp } = await request.json();

    if (action === 'send') {
      if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const newOtp = generateOtp();
      const otpKey = `register_${normalizedEmail}`;

      setRegisterOtp(otpKey, newOtp);
      console.log('[OTP REGISTER] sending otp', { email: normalizedEmail, otp: newOtp, otpKey });

      const emailResult = await sendOtpEmail(normalizedEmail, newOtp);
      if (!emailResult.success) {
        console.error('[OTP REGISTER] sendOtpEmail failed', emailResult);
        return NextResponse.json({ error: `Failed to send OTP: ${emailResult.message}` }, { status: 500 });
      }

      const result = { message: 'OTP sent to your email', email: normalizedEmail, ...(emailResult.otp ? { otp: emailResult.otp } : {}) };
      return NextResponse.json(result, { status: 200 });
    }

    if (action === 'verify') {
      if (!email || !otp) {
        return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const otpKey = `register_${normalizedEmail}`;
      const storedOtp = getRegisterOtp(otpKey);

      if (!storedOtp) {
        return NextResponse.json({ error: 'OTP expired or not sent. Please request a new OTP.' }, { status: 400 });
      }

      if (storedOtp.expiresAt < new Date()) {
        deleteRegisterOtp(otpKey);
        return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
      }

      if (storedOtp.attempts >= 3) {
        deleteRegisterOtp(otpKey);
        return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 400 });
      }

      if (storedOtp.otp !== String(otp).trim()) {
        storedOtp.attempts += 1;
        return NextResponse.json({ error: `Invalid OTP. ${3 - storedOtp.attempts} attempts remaining.` }, { status: 400 });
      }

      const registerToken = generateSecureToken();
      setRegisterToken(registerToken, normalizedEmail);
      deleteRegisterOtp(otpKey);

      return NextResponse.json({ message: 'OTP verified successfully', registerToken }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OTP register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
