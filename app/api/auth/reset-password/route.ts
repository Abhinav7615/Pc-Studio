import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Token from '@/models/Token';
import { verifyFirebaseIdToken } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { resetToken, newPassword, firebaseIdToken } = await request.json();

    if ((!resetToken && !firebaseIdToken) || !newPassword) {
      return NextResponse.json({ error: 'Token or Firebase verification required along with new password' }, { status: 400 });
    }

    await dbConnect();

    let user = null;
    if (firebaseIdToken) {
      try {
        const decodedToken = await verifyFirebaseIdToken(firebaseIdToken);
        const phoneNumber = typeof decodedToken.phone_number === 'string' ? decodedToken.phone_number.replace(/^\+91/, '') : '';
        if (!phoneNumber) {
          return NextResponse.json({ error: 'Firebase token does not contain a valid phone number' }, { status: 400 });
        }
        user = await User.findOne({ mobile: phoneNumber });
      } catch (err) {
        console.error('Firebase ID token verification failed:', err);
        return NextResponse.json({ error: 'Invalid Firebase phone verification token' }, { status: 400 });
      }

      if (!user) {
        return NextResponse.json({ error: 'User with this phone number was not found' }, { status: 404 });
      }
    } else {
      const tokenData = await Token.findOne({ token: resetToken, type: 'reset' });
      if (!tokenData || tokenData.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
      }

      user = await User.findById(tokenData.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      await Token.deleteOne({ _id: tokenData._id });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
