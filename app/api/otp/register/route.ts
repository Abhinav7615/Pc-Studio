import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Token from '@/models/Token';
import { sendOtpEmail } from '@/lib/sendEmail';
import { sendSmsMessage } from '@/lib/sendSms';
import {
  generateOtp,
  setRegisterOtp,
  getRegisterOtp,
  deleteRegisterOtp,
  generateSecureToken,
} from '@/lib/otpStore';

export async function POST(request: NextRequest) {
  try {
    const { action, email, mobile, otp, mobileOtp, emailOtp } = await request.json();

    if (action === 'send') {
      if (!mobile) {
        return NextResponse.json({ error: 'Mobile number required' }, { status: 400 });
      }

      let normalizedEmail: string | undefined;
      if (email) {
        normalizedEmail = String(email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }
      }

      const cleanMobile = String(mobile).replace(/^\+91/, '').replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number. Please enter 10 digits.' }, { status: 400 });
      }

      const mobileOtpValue = generateOtp();
      const mobileOtpKey = `register_mobile_${cleanMobile}`;
      setRegisterOtp(mobileOtpKey, mobileOtpValue);

      const smsResult = await sendSmsMessage(
        cleanMobile,
        `Your Refurbished PC Studio OTP is: ${mobileOtpValue}. Valid for 10 minutes. Do not share with anyone.`
      );
      if (!smsResult.success) {
        console.error('[OTP REGISTER] sendSmsMessage failed', smsResult);
        return NextResponse.json({ error: `Failed to send OTP: ${smsResult.message}` }, { status: 500 });
      }

      const responsePayload: any = {
        message: 'OTP sent to your mobile',
        mobile: `XXXXXX${cleanMobile.slice(-4)}`,
      };

      if (normalizedEmail) {
        const emailOtpValue = generateOtp();
        const emailOtpKey = `register_email_${normalizedEmail}`;
        setRegisterOtp(emailOtpKey, emailOtpValue);

        const emailResult = await sendOtpEmail(normalizedEmail, emailOtpValue);
        if (!emailResult.success) {
          console.error('[OTP REGISTER] sendOtpEmail failed', emailResult);
          return NextResponse.json({ error: `Failed to send OTP: ${emailResult.message}` }, { status: 500 });
        }

        responsePayload.email = normalizedEmail;
        responsePayload.message = 'OTP sent to your mobile and email';
      }

      return NextResponse.json(responsePayload, { status: 200 });
    }

    if (action === 'verify') {
      if (!mobile) {
        return NextResponse.json({ error: 'Mobile number required' }, { status: 400 });
      }

      const cleanMobile = String(mobile).replace(/^\+91/, '').replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
      }

      const mobileOtpValue = (typeof mobileOtp === 'string' && mobileOtp.trim()) ? mobileOtp : (typeof otp === 'string' ? otp : '');
      if (!mobileOtpValue) {
        return NextResponse.json({ error: 'Mobile OTP required' }, { status: 400 });
      }

      const mobileOtpKey = `register_mobile_${cleanMobile}`;
      const storedMobileOtp = getRegisterOtp(mobileOtpKey);
      if (!storedMobileOtp) {
        return NextResponse.json({ error: 'No mobile OTP found. Please request a new OTP.' }, { status: 400 });
      }

      if (storedMobileOtp.expiresAt < new Date()) {
        deleteRegisterOtp(mobileOtpKey);
        return NextResponse.json({ error: 'Mobile OTP expired. Please request a new one.' }, { status: 400 });
      }

      if (storedMobileOtp.attempts >= 3) {
        deleteRegisterOtp(mobileOtpKey);
        return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 400 });
      }

      if (storedMobileOtp.otp !== String(mobileOtpValue).trim()) {
        storedMobileOtp.attempts += 1;
        return NextResponse.json({ error: `Invalid mobile OTP. ${3 - storedMobileOtp.attempts} attempts remaining.` }, { status: 400 });
      }

      let normalizedEmail: string | undefined;
      if (email) {
        normalizedEmail = String(email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        if (!emailOtp) {
          return NextResponse.json({ error: 'Email OTP required' }, { status: 400 });
        }

        const emailOtpKey = `register_email_${normalizedEmail}`;
        const storedEmailOtp = getRegisterOtp(emailOtpKey);
        if (!storedEmailOtp) {
          return NextResponse.json({ error: 'No email OTP found. Please request a new OTP.' }, { status: 400 });
        }

        if (storedEmailOtp.expiresAt < new Date()) {
          deleteRegisterOtp(emailOtpKey);
          return NextResponse.json({ error: 'Email OTP expired. Please request a new one.' }, { status: 400 });
        }

        if (storedEmailOtp.attempts >= 3) {
          deleteRegisterOtp(emailOtpKey);
          return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 400 });
        }

        if (storedEmailOtp.otp !== String(emailOtp).trim()) {
          storedEmailOtp.attempts += 1;
          return NextResponse.json({ error: `Invalid email OTP. ${3 - storedEmailOtp.attempts} attempts remaining.` }, { status: 400 });
        }

        deleteRegisterOtp(emailOtpKey);
      }

      await dbConnect();
      const registerToken = generateSecureToken();
      const tokenQuery: any = {
        type: 'register',
        $or: [{ mobile: cleanMobile }],
      };
      if (normalizedEmail) {
        tokenQuery.$or.push({ email: normalizedEmail });
      }
      await Token.deleteMany(tokenQuery);
      await Token.create({
        token: registerToken,
        type: 'register',
        email: normalizedEmail || undefined,
        mobile: cleanMobile,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      deleteRegisterOtp(mobileOtpKey);

      return NextResponse.json({ message: 'OTP verified successfully', registerToken }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OTP register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
