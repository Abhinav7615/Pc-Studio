import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { sendPushToUser } from '@/lib/push';

export async function createNotification({
  userId,
  type,
  message,
  meta,
}: {
  userId?: string | null;
  type: 'order-status' | 'bargain' | 'outbid' | 'auction' | 'admin-message' | 'new-order' | 'cancellation-request' | 'modification-request' | 'user-action';
  message: string;
  meta?: Record<string, unknown>;
}) {
  await dbConnect();
  return Notification.create({
    user: userId || null,
    type,
    message,
    meta: meta || {},
  });
}

// Wrapper to create notification and optionally push to user's devices
import User from '@/models/User';

export async function createNotificationAndPush(opts: {
  userId?: string | null;
  type: Parameters<typeof createNotification>[0]['type'];
  message: string;
  meta?: Record<string, unknown>;
}) {
  const notification = await createNotification(opts as any);
  try {
    // Always send to the target user if provided
    if (opts.userId) {
      await sendPushToUser(opts.userId, { title: 'Notification', body: opts.message, data: { notificationId: notification._id?.toString(), ...opts.meta } });
    }

    // For order-related events, also push to all admins
    if (opts.type === 'new-order' || opts.type === 'order-status') {
      await dbConnect();
      const admins = await User.find({ role: 'admin', blocked: { $ne: true } }, '_id').lean();
      for (const admin of admins) {
        // Avoid duplicate push if userId is already this admin
        if (!opts.userId || String(admin._id) !== String(opts.userId)) {
          await sendPushToUser(String(admin._id), { title: 'Order Update', body: opts.message, data: { notificationId: notification._id?.toString(), ...opts.meta } });
        }
      }
    }
  } catch (e) {
    console.error('Push send after createNotification failed', e);
  }
  return notification;
}
