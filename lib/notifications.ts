import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

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
