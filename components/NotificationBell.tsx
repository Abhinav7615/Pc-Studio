'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  'order-status': 'Order update',
  bargain: 'Bargain update',
  outbid: 'Outbid alert',
  auction: 'Auction update',
  'admin-message': 'Admin message',
  'new-order': 'New order',
  'cancellation-request': 'Cancellation request',
  'modification-request': 'Modification request',
  'user-action': 'User action',
};

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export default function NotificationBell() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=5');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [status, session]);

  const toggleRead = async (id: string, isRead: boolean) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !isRead }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications((prev) => prev.map((item) => (item._id === id ? data.notification : item)));
      setUnreadCount((prev) => (data.notification.isRead ? Math.max(0, prev - 1) : prev + 1));
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?action=markAll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) return;
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-gray-900 hover:bg-slate-200 transition"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[320px] rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                <p className="text-xs text-slate-500">Latest updates without refresh</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close notification panel"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`border-b border-slate-200 p-4 ${notification.isRead ? 'bg-white' : 'bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[notification.type] || 'Update'}</p>
                      <p className="text-sm text-slate-900">{notification.message}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatTime(notification.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => toggleRead(notification._id, notification.isRead)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {notification.isRead ? 'Mark unread' : 'Mark read'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 p-3">
            <Link href="/notifications" onClick={() => setOpen(false)} className="block w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800">
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
