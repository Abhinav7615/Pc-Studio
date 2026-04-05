import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select('name email mobile referralCode customerId');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, mobile, password, passwordHint } = body;

    if (!name || !email || !mobile || !passwordHint) {
      return NextResponse.json({ error: 'Name, email, mobile and password hint are required' }, { status: 400 });
    }

    await dbConnect();

    const normalizedEmail = (email as string).trim().toLowerCase();
    const normalizedMobile = (mobile as string).trim();

    const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: session.user.id } });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
    }

    const existingMobile = await User.findOne({ mobile: normalizedMobile, _id: { $ne: session.user.id } });
    if (existingMobile) {
      return NextResponse.json({ error: 'Mobile is already in use' }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.name = (name as string).trim();
    user.email = normalizedEmail;
    user.mobile = normalizedMobile;
    user.passwordHint = (passwordHint as string).trim();

    if (password && (password as string).trim()) {
      user.password = await bcrypt.hash((password as string).trim(), 12);
    }

    await user.save();

    const updatedUser = await User.findById(session.user.id).select('-password');
    return NextResponse.json({ message: 'Profile updated', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}