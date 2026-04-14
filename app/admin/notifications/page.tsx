'use client';

import { useEffect, useMemo, useState } from 'react';
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

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'latest' | 'daywise'>('latest');
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/notifications?admin=true&limit=100');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load notifications');
      } else {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!notifications.some((notification) => !notification.isRead)) return;
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications?action=markAll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchNotifications();
  }, [status]);

  const groupedNotifications = useMemo(() => {
    if (filter !== 'daywise') return {};
    return notifications.reduce<Record<string, NotificationItem[]>>((groups, notification) => {
      const day = new Date(notification.createdAt).toLocaleDateString();
      groups[day] = groups[day] || [];
      groups[day].push(notification);
      return groups;
    }, {});
  }, [filter, notifications]);

  const toggleRead = async (id: string, isRead: boolean) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !isRead }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setNotifications((prev) => prev.map((item) => (item._id === id ? data.notification : item)));
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setNotifications((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (status === 'loading') {
    return <div className="p-8">Loading admin notifications...</div>;
  }
  if (!session) return null;

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_auto] mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📣 Admin Notifications</h1>
            <p className="text-gray-600 mt-2">View important user and system messages, and keep your notification inbox clean.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            <button
              onClick={markAllAsRead}
              disabled={markingAll || unreadCount === 0}
              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${unreadCount === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {markingAll ? 'Marking...' : `Mark all as read (${unreadCount})`}
            </button>
            <button onClick={() => setFilter('latest')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'latest' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              Latest
            </button>
            <button onClick={() => setFilter('daywise')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'daywise' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              Day-wise
            </button>
            <button onClick={fetchNotifications} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800">
              Refresh
            </button>
          </div>
        </div>
        {message && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">{message}</div>}
        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No notifications have been generated yet.</div>
          ) : filter === 'daywise' ? (
            Object.entries(groupedNotifications).map(([day, items]) => (
              <div key={day} className="mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-4">{day}</p>
                <div className="space-y-3">
                  {items.map((notification) => (
                    <div key={notification._id} className={`rounded-2xl border p-4 ${notification.isRead ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-300'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[notification.type] || 'Update'}</p>
                          <p className="mt-1 text-sm text-slate-900">{notification.message}</p>
                          <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => toggleRead(notification._id, notification.isRead)} className="text-xs text-blue-600 hover:underline">
                            {notification.isRead ? 'Mark unread' : 'Mark read'}
                          </button>
                          <button onClick={() => deleteNotification(notification._id)} className="text-xs text-red-600 hover:underline">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification._id} className={`rounded-2xl border p-4 ${notification.isRead ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[notification.type] || 'Update'}</p>
                      <p className="mt-1 text-sm text-slate-900">{notification.message}</p>
                      <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => toggleRead(notification._id, notification.isRead)} className="text-xs text-blue-600 hover:underline">
                        {notification.isRead ? 'Mark unread' : 'Mark read'}
                      </button>
                      <button onClick={() => deleteNotification(notification._id)} className="text-xs text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
