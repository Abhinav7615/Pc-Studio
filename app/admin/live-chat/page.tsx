'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

interface ChatItem {
  _id: string;
  status: 'active' | 'closed';
  escalated: boolean;
  joinedAt?: string;
  joinedBy?: { _id?: string; name?: string; email?: string };
  createdAt: string;
  updatedAt: string;
  user: { _id: string; name?: string; email?: string; mobile?: string };
}

interface MessageItem {
  _id: string;
  sender: 'user' | 'admin' | 'bot';
  message: string;
  seen: boolean;
  createdAt: string;
}

export default function AdminLiveChatPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [reply, setReply] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingJoinMessage, setSavingJoinMessage] = useState(false);
  const [joiningChat, setJoiningChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session && session.user && session.user.role !== 'admin' && session.user.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats?active=true');
      if (!res.ok) throw new Error('Failed to load chats');
      const data = await res.json();
      setChats(data.chats || []);
      if (!selectedChat && data.chats?.length) {
        setSelectedChat(data.chats[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || []);
      await fetch(`/api/chats/${chatId}/messages?markSeen=true`, { method: 'PATCH' });
    } catch (err) {
      console.error(err);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/business-settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setJoinMessage(data.chatJoinMessage || 'An agent has joined your chat and will respond shortly.');
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveJoinMessage = async () => {
    setSavingJoinMessage(true);
    try {
      const res = await fetch('/api/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatJoinMessage: joinMessage }),
      });
      if (!res.ok) throw new Error('Failed to save join message');
      await loadSettings();
    } catch (err) {
      console.error(err);
      setError('Unable to save join message.');
    } finally {
      setSavingJoinMessage(false);
    }
  };

  const joinChat = async () => {
    if (!selectedChat) return;
    setError('');
    setJoiningChat(true);
    try {
      const res = await fetch(`/api/chats/${selectedChat._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to join chat');
        return;
      }
      setSelectedChat(data.chat || selectedChat);
      loadMessages(selectedChat._id);
      loadChats();
    } catch (err) {
      console.error(err);
      setError('Failed to join chat.');
    } finally {
      setJoiningChat(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadChats();
      loadSettings();
    }
  }, [status]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  const selectChat = (chat: ChatItem) => {
    setSelectedChat(chat);
    setError('');
  };

  const selectedChatJoinedBy = selectedChat?.joinedBy as any;
  const selectedChatJoinedById = selectedChatJoinedBy?._id?.toString?.() || selectedChatJoinedBy?.toString?.();
  const isAssignedToMe = selectedChatJoinedById === session?.user.id;
  const canSendReply = Boolean(selectedChat && selectedChat.escalated && isAssignedToMe);

  const sendReply = async () => {
    if (!selectedChat || !reply.trim()) return;
    if (!selectedChat.escalated) {
      setError('You can only reply after the customer requests a Support Specialist and you join the chat.');
      return;
    }
    if (!isAssignedToMe) {
      setError('This escalated chat has been assigned to another specialist. You cannot reply here.');
      return;
    }
    setError('');
    try {
      const res = await fetch(`/api/chats/${selectedChat._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send reply');
        return;
      }
      setMessages(data.messages || []);
      setSelectedChat(data.chat || selectedChat);
      setReply('');
      loadChats();
    } catch (err) {
      console.error(err);
      setError('Failed to send reply.');
    }
  };

  const closeChat = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      if (!res.ok) throw new Error('Failed to close chat');
      const data = await res.json();
      setSelectedChat(data.chat || null);
      loadChats();
    } catch (err) {
      console.error(err);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading support chat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Live Chat Support</h1>
            <p className="text-red-100 text-sm">Reply to customers, close chats, and manage active support requests.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => signOut({ redirect: true, callbackUrl: '/' })} className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-800">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-8 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-2 md:grid-cols-10 gap-3">
            <Link href="/admin" className="px-3 py-2 rounded bg-gray-100 text-gray-900 text-center">Dashboard</Link>
            <Link href="/admin/products" className="px-3 py-2 rounded bg-gray-100 text-gray-900 text-center">Products</Link>
            <Link href="/admin/orders" className="px-3 py-2 rounded bg-gray-100 text-gray-900 text-center">Orders</Link>
            <Link href="/admin/notifications" className="px-3 py-2 rounded bg-gray-100 text-gray-900 text-center">Notifications</Link>
            <Link href="/admin/users" className="px-3 py-2 rounded bg-gray-100 text-gray-900 text-center">Users</Link>
            <Link href="/admin/live-chat" className="px-3 py-2 rounded bg-red-600 text-white text-center">Live Chat</Link>
            <Link href="/admin/reviews" className="px-3 py-2 rounded bg-gray-100 text-gray-900 text-center">Reviews</Link>
            <Link href="/admin/content" className="px-3 py-2 rounded bg-gray-100 text-gray-900 text-center">Content</Link>
            <Link href="/admin/settings" className="px-3 py-2 rounded bg-gray-100 text-gray-900 text-center">Settings</Link>
            <Link href="/admin/theme" className="px-3 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center">Theme</Link>
          </div>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active chats</h2>
                <p className="text-sm text-gray-500">Select an open chat to reply and close.</p>
              </div>
              <button onClick={loadChats} className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-gray-500">Loading chats…</div>
            ) : chats.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No active chats right now.</div>
            ) : (
              <div className="space-y-3">
                {chats.map((chat) => (
                  <button key={chat._id} onClick={() => selectChat(chat)} className={`w-full rounded-3xl border p-4 text-left transition ${selectedChat?._id === chat._id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{chat.user.name || chat.user.email || chat.user.mobile || 'Customer'}</p>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${chat.escalated ? (chat.joinedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700') : 'bg-slate-100 text-slate-700'}`}>{chat.escalated ? (chat.joinedAt ? 'Joined' : 'Waiting') : 'Bot'}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{chat.user.email || chat.user.mobile || 'No contact available'}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{chat.status === 'active' ? 'Active' : 'Closed'}</span>
                      <span>{new Date(chat.updatedAt).toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Chat details</h2>
                <p className="text-sm text-gray-500">Reply to user messages and manage the conversation.</p>
              </div>
              {selectedChat && (
                <button onClick={closeChat} className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                  End chat
                </button>
              )}
            </div>

            {!selectedChat ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Choose a chat from the list to begin.</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 p-4 bg-slate-50 space-y-3">
                  <p className="text-sm text-slate-700"><strong>User:</strong> {selectedChat.user.name || selectedChat.user.email || selectedChat.user.mobile}</p>
                  <p className="text-sm text-slate-500">Chat status: {selectedChat.status}</p>
                  <p className="text-sm text-slate-500">Escalated: {selectedChat.escalated ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-slate-500">Agent joined: {selectedChat.joinedAt ? 'Yes' : 'No'}</p>
                  {selectedChat.joinedBy && (
                    <p className="text-sm text-slate-500">Assigned to: {selectedChat.joinedBy.name || selectedChat.joinedBy.email || 'Support Specialist'}</p>
                  )}

                  {selectedChat.escalated && !selectedChat.joinedAt && (
                    <button
                      onClick={joinChat}
                      disabled={savingJoinMessage}
                      className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Join chat and notify customer
                    </button>
                  )}

                  {selectedChat.joinedAt && (
                    <p className="text-sm text-slate-500">Joined at: {new Date(selectedChat.joinedAt).toLocaleString()}</p>
                  )}

                  {selectedChat.escalated && selectedChat.joinedAt && !isAssignedToMe && (
                    <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-900">
                      This escalated chat is already assigned to another specialist. You can view conversation history but only the assigned agent can reply.
                    </div>
                  )}

                  {!selectedChat.escalated && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
                      The customer is still chatting with the bot. Wait for a Support Specialist request before joining.
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Default join message</p>
                      <p className="text-sm text-slate-500">This message is sent automatically when an agent joins a requested chat.</p>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={joinMessage}
                    onChange={(event) => setJoinMessage(event.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={saveJoinMessage}
                    disabled={savingJoinMessage}
                    className="mt-3 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save join message
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[440px] rounded-3xl border border-slate-200 p-4">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages yet.</p>
                  ) : messages.map((msg) => (
                    <div key={msg._id} className={`rounded-3xl p-4 ${msg.sender === 'user' ? 'bg-blue-50 text-slate-900' : msg.sender === 'admin' ? 'bg-green-50 text-slate-900' : 'bg-slate-100 text-slate-900'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{msg.sender === 'user' ? 'Customer' : msg.sender === 'admin' ? 'You' : 'Bot'}</span>
                        <span className="text-[11px] text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6">{msg.message}</p>
                      {msg.sender === 'user' && (
                        <p className="mt-2 text-[11px] text-slate-500">{msg.seen ? 'Seen by you' : 'New'}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {!canSendReply && selectedChat?.escalated && selectedChat.joinedAt && !isAssignedToMe && (
                    <p className="text-sm text-yellow-700">This chat is assigned to another specialist. You can still review the conversation.</p>
                  )}
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Type your reply here..."
                    disabled={!canSendReply}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim() || !canSendReply}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send reply
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
