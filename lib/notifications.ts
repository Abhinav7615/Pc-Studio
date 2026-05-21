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
export async function createNotificationAndPush(opts: {
  userId?: string | null;
  type: Parameters<typeof createNotification>[0]['type'];
  message: string;
  meta?: Record<string, unknown>;
}) {
  const notification = await createNotification(opts as any);
  try {
    await sendPushToUser(opts.userId || null, { title: 'Notification', body: opts.message, data: { notificationId: notification._id?.toString(), ...opts.meta } });
  } catch (e) {
    console.error('Push send after createNotification failed', e);
  }
  return notification;
}
