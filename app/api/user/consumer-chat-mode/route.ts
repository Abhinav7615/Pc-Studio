import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body.consumerChatEnabled !== 'boolean') {
      return NextResponse.json({ error: 'consumerChatEnabled must be a boolean' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.consumerChatEnabled = body.consumerChatEnabled;
    await user.save();

    return NextResponse.json({ message: 'Chat mode updated', consumerChatEnabled: user.consumerChatEnabled }, { status: 200 });
  } catch (error) {
    console.error('Consumer chat mode update failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
