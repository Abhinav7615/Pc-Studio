import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    // Get user and their session info
    const user = await User.findById(userId).select('lastActive email name mobile customerId');
    
    if (!user) {
      return Response.json({ online: false }, { status: 200 });
    }

    // Check if user was active in the last 60 seconds
    const lastActiveTime = new Date(user.lastActive || 0);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastActiveTime.getTime()) / 1000;
    
    const isOnline = diffSeconds < 60; // Online if active in last 60 seconds

    return Response.json({
      online: isOnline,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        customerId: user.customerId,
      },
    });
  } catch (err) {
    console.error('Error checking online status:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Update user's lastActive timestamp
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { lastActive: new Date() },
      { new: true }
    );

    return Response.json({ success: true, online: true });
  } catch (err) {
    console.error('Error updating online status:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
