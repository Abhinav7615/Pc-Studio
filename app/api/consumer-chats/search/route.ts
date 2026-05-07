import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { isValidObjectId } from 'mongoose';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const query = request.nextUrl.searchParams.get('q')?.trim() || '';
  if (!query) {
    return NextResponse.json({ users: [] }, { status: 200 });
  }

  const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const digits = query.replace(/\D/g, '');
  const normalizedMobile = digits.length === 10
    ? digits
    : digits.length === 12 && digits.startsWith('91')
      ? digits.slice(-10)
      : '';

  const searchQuery: any = {
    role: 'customer',
    _id: { $ne: session.user.id },
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { customerId: searchRegex },
    ],
  };

  if (normalizedMobile) {
    searchQuery.$or.push(
      { mobile: normalizedMobile },
      { mobile: new RegExp(`(?:\\+?91)?${normalizedMobile}$`) }
    );
  } else if (digits.length >= 6) {
    searchQuery.$or.push({ mobile: new RegExp(`${digits}$`) });
  }

  const users = await User.find(searchQuery)
    .select('name email mobile customerId')
    .limit(10)
    .sort({ createdAt: -1 });

  return NextResponse.json({ users }, { status: 200 });
}
