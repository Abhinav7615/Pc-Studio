import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getResetToken, deleteResetToken } from '@/lib/otpStore';

export async function POST(request: NextRequest) {
  try {
    const { resetToken, newPassword } = await request.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json({ error: 'Token and new password required' }, { status: 400 });
    }

    const tokenData = getResetToken(resetToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(tokenData.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    deleteResetToken(resetToken);

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
