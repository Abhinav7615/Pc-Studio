import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';

const validNotificationTypes = [
  'order-status',
  'bargain',
  'outbid',
  'auction',
  'admin-message',
  'new-order',
  'cancellation-request',
  'modification-request',
  'user-action',
];

const preferenceTypeMapping: Record<string, string> = {
  orderUpdates: 'order-status',
  bargain: 'bargain',
  outbid: 'outbid',
  auction: 'auction',
  adminMessages: 'admin-message',
};

function getAllowedTypes(preferences: any) {
  const enabledTypes: string[] = [];
  if (!preferences) {
    return ['order-status', 'bargain', 'outbid', 'auction', 'admin-message'];
  }

  Object.entries(preferenceTypeMapping).forEach(([prefKey, type]) => {
    if (preferences[prefKey] !== false) {
      enabledTypes.push(type);
    }
  });

  return enabledTypes;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await dbConnect();

    const url = request.nextUrl;
    const limitParam = url.searchParams.get('limit');
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '20', 10)));
    const adminView = url.searchParams.get('admin') === 'true';

    // Admin/staff can request full list when admin=true
    if (session && (session.user.role === 'admin' || session.user.role === 'staff') && adminView) {
      const notifications = await Notification.find().sort({ createdAt: -1 }).limit(limit).lean();
      const unreadCount = await Notification.countDocuments({ isRead: false });
      return NextResponse.json({ notifications, unreadCount }, { status: 200 });
    }

    // Anonymous: only public notifications (user === null)
    if (!session) {
      const notifications = await Notification.find({ user: null }).sort({ createdAt: -1 }).limit(limit).lean();
      const unreadCount = await Notification.countDocuments({ user: null, isRead: false });
      return NextResponse.json({ notifications, unreadCount }, { status: 200 });
    }

    // Authenticated user: return notifications addressed to user or global ones, filtered by user preferences
    const user = await User.findById(session.user.id).select('notificationPreferences');
    const enabledTypes = getAllowedTypes(user?.notificationPreferences);

    const query: any = {
      $and: [
        { $or: [{ user: session.user.id }, { user: null }] },
        { type: { $in: enabledTypes } },
      ],
    };

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });
    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { userId, type, message, meta } = body;
  if (!type || !validNotificationTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
  }
  if (!message || String(message).trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    await dbConnect();
    const notification = await Notification.create({
      user: userId || null,
      type,
      message: String(message).trim(),
      meta: meta || {},
    });
    return NextResponse.json({ notification, message: 'Notification created' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const markAllAction = request.nextUrl.searchParams.get('action') === 'markAll';
  const notificationId = request.nextUrl.searchParams.get('id');

  const body = await request.json();
  const { isRead } = body;
  if (typeof isRead !== 'boolean') {
    return NextResponse.json({ error: 'isRead boolean is required' }, { status: 400 });
  }

  await dbConnect();

  try {
    if (markAllAction) {
      if (session.user.role === 'admin' || session.user.role === 'staff') {
        await Notification.updateMany({ isRead: false }, { isRead });
      } else {
        const user = await User.findById(session.user.id).select('notificationPreferences');
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const enabledTypes = getAllowedTypes(user.notificationPreferences);
        await Notification.updateMany(
          {
            $and: [
              { $or: [{ user: session.user.id }, { user: null }] },
              { type: { $in: enabledTypes } },
              { isRead: false },
            ],
          },
          { isRead },
        );
      }
      return NextResponse.json({ message: 'All notifications updated' }, { status: 200 });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'staff') {
      if (!notification.user || notification.user.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    notification.isRead = isRead;
    await notification.save();
    return NextResponse.json({ notification, message: 'Notification updated' }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notificationId = request.nextUrl.searchParams.get('id');
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
  }

  await dbConnect();

  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'staff') {
      if (!notification.user || notification.user.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await notification.deleteOne();
    return NextResponse.json({ message: 'Notification deleted' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
