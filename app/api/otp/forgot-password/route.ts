import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Token from '@/models/Token';
import { sendOtpEmail } from '@/lib/sendEmail';
import { sendSmsMessage } from '@/lib/sendSms';
import {
  generateOtp,
  setForgotOtp,
  getForgotOtp,
  deleteForgotOtp,
  generateSecureToken,
} from '@/lib/otpStore';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { action, identifier, otp, method = 'email' } = await request.json();

    if (action === 'send') {
      // Send OTP for forgot password
      if (!identifier) {
        return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
      }

      const user = await User.findOne({
        $or: [{ email: identifier }, { mobile: identifier }],
      });

      if (!user) {
        return NextResponse.json({ error: 'No user found with that email or mobile' }, { status: 404 });
      }

      // Generate OTP
      const newOtp = generateOtp();
      const otpKey = `forgot_${user._id}`;
      setForgotOtp(otpKey, newOtp);

      let sendResult;
      let responsePayload;

      if (method === 'mobile') {
        if (!user.mobile) {
          return NextResponse.json({ error: 'No mobile number is associated with this account' }, { status: 400 });
        }

        // Send OTP via SMS
        sendResult = await sendSmsMessage(
          user.mobile,
          `Your Refurbished PC Studio OTP is: ${newOtp}. Valid for 10 minutes. Do not share with anyone.`
        );
        if (!sendResult.success) {
          console.error('[OTP FORGOT] sendSmsMessage SMS failed', sendResult);
          return NextResponse.json(
            { error: `Failed to send OTP: ${sendResult.message}` },
            { status: 500 }
          );
        }
        responsePayload = {
          message: 'OTP sent to your mobile',
          userId: user._id,
          maskedMobile: `XXXXXX${user.mobile.slice(-4)}`,
        };
      } else {
        if (!user.email) {
          return NextResponse.json(
            { error: 'No email is associated with this account. Please use mobile OTP instead.' },
            { status: 400 }
          );
        }

        // Send OTP via Email (default)
        sendResult = await sendOtpEmail(user.email, newOtp);
        if (!sendResult.success) {
          console.error('[OTP FORGOT] sendOtpEmail failed', sendResult);
          return NextResponse.json(
            { error: `Failed to send OTP: ${sendResult.message}` },
            { status: 500 }
          );
        }
        responsePayload = {
          message: 'OTP sent to your email',
          userId: user._id,
          maskedEmail: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        };
      }

      return NextResponse.json(responsePayload, { status: 200 });
    } else if (action === 'verify') {
      // Verify OTP for forgot password
      if (!identifier || !otp) {
        return NextResponse.json(
          { error: 'Identifier and OTP required' },
          { status: 400 }
        );
      }

      const user = await User.findOne({
        $or: [{ email: identifier }, { mobile: identifier }],
      });

      if (!user) {
        return NextResponse.json({ error: 'No user found with that email or mobile' }, { status: 404 });
      }

      const otpKey = `forgot_${user._id}`;
      const storedOtp = getForgotOtp(otpKey);

      if (!storedOtp) {
        return NextResponse.json(
          { error: 'OTP expired or not sent. Please request a new OTP.' },
          { status: 400 }
        );
      }

      if (storedOtp.expiresAt < new Date()) {
        deleteForgotOtp(otpKey);
        return NextResponse.json(
          { error: 'OTP expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (storedOtp.attempts >= 3) {
        deleteForgotOtp(otpKey);
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
      const resetToken = generateSecureToken();
      await Token.deleteMany({ userId: user._id, type: 'reset' });
      await Token.create({
        token: resetToken,
        type: 'reset',
        email: user.email,
        userId: user._id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      deleteForgotOtp(otpKey);

      return NextResponse.json(
        {
          message: 'OTP verified successfully',
          resetToken,
          userId: user._id,
          hint: user.passwordHint,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
