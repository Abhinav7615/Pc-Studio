'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ConsumerUser {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  customerId?: string;
}

interface ConsumerChat {
  _id: string;
  type: 'consumer';
  status: 'pending' | 'active' | 'closed';
  participants: ConsumerUser[];
  targetUser: ConsumerUser;
  user: ConsumerUser;
  requestedAt?: string;
  acceptedAt?: string;
  lastMessageAt?: string;
}

interface MessageItem {
  _id: string;
  sender: 'user' | 'admin' | 'bot';
  senderId?: string;
  senderName?: string;
  type: 'text' | 'audio' | 'image';
  content: string;
  metadata?: any;
  createdAt: string;
}

export default function AdminConsumerChatsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [chats, setChats] = useState<ConsumerChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<ConsumerChat | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [consumerChatEnabled, setConsumerChatEnabled] = useState<boolean>(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');

  const loadConsumerChatSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/chat-settings');
      if (!res.ok) throw new Error('Failed to load consumer chat settings');
      const data = await res.json();
      setConsumerChatEnabled(data.consumerChatEnabled ?? true);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const toggleConsumerChatEnabled = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsStatus('');
    try {
      const res = await fetch('/api/chat-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumerChatEnabled: !consumerChatEnabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSettingsStatus(data.error || 'Unable to update consumer chat setting');
        return;
      }
      setConsumerChatEnabled(data.consumerChatEnabled ?? !consumerChatEnabled);
      setSettingsStatus(`Consumer chat has been ${data.consumerChatEnabled ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      console.error(err);
      setSettingsStatus('Unable to update consumer chat setting');
    } finally {
      setSettingsLoading(false);
    }
  }, [consumerChatEnabled]);

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/consumer-chats');
      if (!res.ok) throw new Error('Failed to load consumer chats');
      const data = await res.json();
      setChats(data.chats || []);
      if (!selectedChat && Array.isArray(data.chats) && data.chats.length > 0) {
        setSelectedChat(data.chats[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedChat]);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/consumer-chats/${chatId}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    if (status === 'authenticated') {
      loadChats();
      loadConsumerChatSettings();
    }
  }, [status, router, loadChats, loadConsumerChatSettings]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
    }
  }, [selectedChat, loadMessages]);

  const selectChat = (chat: ConsumerChat) => {
    setSelectedChat(chat);
    setStatusText('');
  };

  const sendReply = async () => {
    if (!selectedChat || !reply.trim()) return;
    setStatusText('Sending reply...');
    try {
      const res = await fetch(`/api/consumer-chats/${selectedChat._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', content: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusText(data.error || 'Reply failed');
        return;
      }
      setReply('');
      setStatusText('Reply sent');
      await loadMessages(selectedChat._id);
      await loadChats();
    } catch (err) {
      console.error(err);
      setStatusText('Failed to send reply');
    }
  };

  const closeChat = async () => {
    if (!selectedChat) return;
    setStatusText('Closing chat...');
    try {
      const res = await fetch(`/api/consumer-chats/${selectedChat._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusText(data.error || 'Unable to close chat');
        return;
      }
      setStatusText('Conversation closed');
      await loadChats();
      if (data.chat) {
        setSelectedChat(data.chat);
      }
    } catch (err) {
      console.error(err);
      setStatusText('Close chat failed');
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Consumer-to-Consumer Chat</h1>
          <p className="mt-2 text-gray-600">View all consumer-to-consumer conversations and reply as admin if needed.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.3fr]">
          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Consumer Chat Settings</h2>
                  <p className="text-sm text-gray-600">Enable or disable consumer-to-consumer chats and manage the conversation feature from here.</p>
                </div>
                <button
                  onClick={toggleConsumerChatEnabled}
                  disabled={settingsLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {consumerChatEnabled ? 'Disable Consumer Chat' : 'Enable Consumer Chat'}
                </button>
              </div>
              <div className="mt-4 rounded-3xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Status: {consumerChatEnabled ? 'Enabled' : 'Disabled'}</p>
                <p className="mt-2 text-sm text-slate-600">When consumer chat is disabled, customers cannot send or accept consumer-to-consumer chat requests.</p>
                {settingsStatus && <p className="mt-3 text-sm text-slate-700">{settingsStatus}</p>}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">All consumer chats</h2>
                <button onClick={loadChats} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Refresh</button>
              </div>
              <div className="mt-4 space-y-3">
                {loading && <p className="text-sm text-gray-500">Loading chats...</p>}
                {!loading && chats.length === 0 && <p className="text-sm text-gray-500">No consumer chats found.</p>}
                {chats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => selectChat(chat)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${selectedChat?._id === chat._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{chat.user?.name || 'Requester customer'}</p>
                        <p className="text-sm text-gray-600">Target: {chat.targetUser?.name || 'Unknown'}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${chat.status === 'active' ? 'bg-green-100 text-green-800' : chat.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                        {chat.status}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                      Requested: {chat.requestedAt ? new Date(chat.requestedAt).toLocaleString() : 'N/A'}
                      {chat.acceptedAt && (
                        <><br />Accepted: {new Date(chat.acceptedAt).toLocaleString()}</>
                      )}
                      <br />
                      Last updated: {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'N/A'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-200">
            {selectedChat ? (
              <>
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Conversation details</h2>
                    <p className="text-sm text-gray-600">{selectedChat.user?.name || 'Requester'} → {selectedChat.targetUser?.name || 'Target'}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Requested: {selectedChat.requestedAt ? new Date(selectedChat.requestedAt).toLocaleString() : 'N/A'}
                      {selectedChat.acceptedAt && (
                        <><br />Accepted: {new Date(selectedChat.acceptedAt).toLocaleString()}</>
                      )}
                      <br />
                      Last message: {selectedChat.lastMessageAt ? new Date(selectedChat.lastMessageAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <button onClick={closeChat} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">Close chat</button>
                </div>

                <div className="space-y-4 max-h-[54vh] overflow-y-auto pr-2 pb-2">
                  {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
                  {messages.map((msg) => (
                    <div key={msg._id} className={`rounded-3xl border p-4 ${msg.sender === 'admin' ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{msg.senderName || (msg.sender === 'admin' ? 'Admin' : 'Customer')}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="mt-2">
                        {msg.type === 'text' && <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>}
                        {msg.type === 'audio' && (
                          <audio controls className="max-w-full">
                            <source src={msg.content} type={msg.metadata?.mimeType || 'audio/webm'} />
                            Your browser does not support the audio element.
                          </audio>
                        )}
                        {msg.type === 'image' && (
                          <img src={msg.content} alt={msg.metadata?.fileName || 'Image'} className="max-w-full rounded-lg" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3">
                  <textarea
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reply to this conversation as admin"
                  />
                  <button onClick={sendReply} className="rounded-3xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">Send reply</button>
                  {statusText && <p className="text-sm text-gray-700">{statusText}</p>}
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-gray-600">
                <p className="text-sm">Select a consumer chat from the list to view details and reply.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
