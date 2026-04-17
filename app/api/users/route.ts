import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateUniqueCustomerId } from '@/lib/referral';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let users;

    if (session.user.role === 'admin') {
      // Hide the default/main admin account from list; secondary admins are visible
      users = await User.find({ _id: { $ne: session.user.id }, ...{ $or: [{ adminEmail: { $exists: false } }, { adminEmail: null }] } }).sort({ createdAt: -1 });
    } else {
      users = await User.find({ _id: { $ne: session.user.id }, ...{ $or: [{ adminEmail: { $exists: false } }, { adminEmail: null }] } }).select('-password').sort({ createdAt: -1 });
    }

    return NextResponse.json(users, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admin can create users' }, { status: 401 });
    }

    await dbConnect();

    const { name, email, mobile, password, passwordHint } = await request.json();

    if (!name || !email || !mobile || !password || !passwordHint) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const customerId = await generateUniqueCustomerId();

    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      passwordHint,
      role: 'staff',
      customerId,
    });

    await user.save();

    return NextResponse.json({ message: 'Staff added successfully' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
