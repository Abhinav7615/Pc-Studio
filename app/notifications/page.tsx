'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
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

const notificationPreferencesDefaults = {
  orderUpdates: true,
  bargain: true,
  outbid: true,
  auction: true,
  adminMessages: true,
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'latest' | 'daywise'>('latest');
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<typeof notificationPreferencesDefaults>(notificationPreferencesDefaults);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefMessage, setPrefMessage] = useState('');
  const [prefError, setPrefError] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=100');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Notification fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  const fetchPreferences = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const res = await fetch('/api/user/notification-preferences');
      const data = await res.json();
      if (res.ok) {
        setPrefs({ ...notificationPreferencesDefaults, ...data.notificationPreferences });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchNotifications();
    fetchPreferences();
  }, [status, fetchNotifications, fetchPreferences]);

  const groupedNotifications = useMemo(() => {
    if (filter === 'daywise') {
      return notifications.reduce<Record<string, NotificationItem[]>>((groups, notification) => {
        const day = new Date(notification.createdAt).toLocaleDateString();
        groups[day] = groups[day] || [];
        groups[day].push(notification);
        return groups;
      }, {});
    }
    return {};
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
      setUnreadCount((prev) => (data.notification.isRead ? Math.max(0, prev - 1) : prev + 1));
    } catch (error) {
      console.error('Failed to toggle notification read status:', error);
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

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?action=markAll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setPrefLoading(true);
    setPrefMessage('');
    setPrefError('');
    try {
      const res = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences: prefs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPrefError(data.error || 'Failed to save preferences');
      } else {
        setPrefMessage('Notification preferences saved.');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Preference save failed:', error);
      setPrefError('Failed to save preferences');
    } finally {
      setPrefLoading(false);
    }
  };

  if (status === 'loading') return <div className="p-8">Loading...</div>;
  if (!session) return null;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔔 Notifications</h1>
            <p className="text-gray-600 mt-1">View recent alerts and control which notification types you want to receive.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-500">Unread</p>
            <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Notifications</h2>
                <p className="text-sm text-gray-600">Latest alerts and updates delivered to your account.</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => setFilter('latest')}
                  className={`px-4 py-2 rounded-lg text-sm ${filter === 'latest' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setFilter('daywise')}
                  className={`px-4 py-2 rounded-lg text-sm ${filter === 'daywise' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Day-wise
                </button>
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Mark all as read
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : filter === 'daywise' ? (
              Object.entries(groupedNotifications).map(([day, items]) => (
                <div key={day} className="mb-6">
                  <p className="text-sm font-semibold text-slate-700 mb-4">{day}</p>
                  <div className="space-y-3">
                    {items.map((notification) => (
                      <div key={notification._id} className={`rounded-2xl border p-4 ${notification.isRead ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[notification.type] || 'Update'}</p>
                            <p className="mt-1 text-sm text-slate-900">{notification.message}</p>
                            <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleTimeString()}</p>
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
                  <div key={notification._id} className={`rounded-2xl border p-4 ${notification.isRead ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[notification.type] || 'Update'}</p>
                        <p className="mt-1 text-sm text-slate-900">{notification.message}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatTime(notification.createdAt)}</p>
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
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification preferences</h2>
            <p className="text-sm text-gray-600 mb-4">Enable or disable the types of notifications you want to receive.</p>

            {prefMessage && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">{prefMessage}</div>}
            {prefError && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">{prefError}</div>}

            {Object.entries(prefs).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 mb-3 cursor-pointer bg-slate-50 hover:bg-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{key === 'orderUpdates' ? 'Order updates' : key === 'bargain' ? 'Bargain notifications' : key === 'outbid' ? 'Outbid alerts' : key === 'auction' ? 'Auction updates' : 'Admin messages'}</p>
                  <p className="text-xs text-slate-500">{key === 'adminMessages' ? 'Messages from admin and system alerts.' : 'Receive this notification type in the app.'}</p>
                </div>
                <input type="checkbox" checked={value} onChange={() => setPrefs((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </label>
            ))}

            <button onClick={savePreferences} disabled={prefLoading} className="mt-3 w-full rounded-2xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600">
              {prefLoading ? 'Saving...' : 'Save preferences'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}
