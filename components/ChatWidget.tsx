'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { buildAdminGreeting, generateAdminBotResponse } from '@/lib/chatBot';

interface ChatItem {
  _id: string;
  status: 'active' | 'closed';
  escalated: boolean;
}

interface MessageItem {
  _id: string;
  sender: 'user' | 'admin' | 'bot';
  message: string;
  seen: boolean;
  createdAt: string;
}

export default function ChatWidget() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [botName, setBotName] = useState('ShopBot');
  const [botEnabled, setBotEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showSupportOption, setShowSupportOption] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [supportStartTime, setSupportStartTime] = useState('09:00');
  const [supportEndTime, setSupportEndTime] = useState('17:00');
  const [input, setInput] = useState('');
  const [adminInput, setAdminInput] = useState('');
  const [adminMessages, setAdminMessages] = useState<Array<{ sender: 'user' | 'bot'; message: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const canAdminChat = status === 'authenticated' && (session?.user?.role === 'admin' || session?.user?.role === 'staff');
  const canCustomerChat = status === 'authenticated' && session?.user?.role === 'customer';
  const canChat = canCustomerChat || (canAdminChat && isAdminPage);

  const fetchChat = async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const res = await fetch('/api/chats?active=true');
      if (!res.ok) return;
      const data = await res.json();
      if (data.chat) {
        setChat(data.chat);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Chat fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/chat-settings');
      if (!res.ok) return;
      const data = await res.json();
      setChatEnabled(data.chatEnabled !== false);
      setBotName(data.chatBotName || 'ShopBot');
      setBotEnabled(data.chatBotEnabled !== false);
      setSupportStartTime(data.paymentVerificationStartTime || '09:00');
      setSupportEndTime(data.paymentVerificationEndTime || '17:00');
    } catch (err) {
      console.error('Chat settings fetch failed:', err);
    } finally {
      setSettingsLoaded(true);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      await markMessagesSeen(chatId);
    } catch (err) {
      console.error('Message fetch failed:', err);
    }
  };

  const markMessagesSeen = async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}/messages?markSeen=true`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark messages seen:', err);
    }
  };

  const createChat = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Unable to create chat session');
        return;
      }
      const data = await res.json();
      setChat(data.chat);
      setMessages(data.messages || []);
      setShowSupportOption(false);
    } catch (err) {
      console.error('Create chat failed:', err);
      setError('Unable to create chat session');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chat || !input.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/chats/${chat._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        return;
      }
      setChat(data.chat);
      setMessages(data.messages || []);
      setShowSupportOption(data.showSupportOption ?? false);
      setInput('');
      if (data.escalationRequested) {
        setError('A Support Specialist has been requested. Please wait for an agent.');
      }
    } catch (err) {
      console.error('Send message failed:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const connectToHuman = async () => {
    if (!chat) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/chats/${chat._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalate: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to connect to support.');
        return;
      }
      setChat(data.chat);
      setMessages(data.messages || []);
      setShowSupportOption(data.showSupportOption ?? false);
      if (data.escalationRequested) {
        setError('A Support Specialist has been requested. Please wait for an agent.');
      }
    } catch (err) {
      console.error('Connect human failed:', err);
      setError('Failed to connect to support. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const sendAdminMessage = () => {
    if (!adminInput.trim()) return;
    const messageText = adminInput.trim();
    const updatedMessages = [...adminMessages, { sender: 'user', message: messageText }];
    setAdminMessages(updatedMessages);
    setAdminInput('');
    const botResult = generateAdminBotResponse(messageText, updatedMessages);
    setTimeout(() => {
      setAdminMessages((prev) => [...prev, { sender: 'bot', message: botResult.text }]);
    }, 100);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (open && session?.user && status === 'authenticated' && canCustomerChat) {
      fetchChat();
    }
  }, [open, status, session, canCustomerChat]);

  useEffect(() => {
    if (open && canAdminChat && isAdminPage && adminMessages.length === 0) {
      setAdminMessages([{ sender: 'bot', message: buildAdminGreeting(botName) }]);
    }
  }, [open, canAdminChat, isAdminPage, adminMessages.length, botName]);

  useEffect(() => {
    if (chat?.status === 'active') {
      const interval = setInterval(() => fetchMessages(chat._id), 5000);
      return () => clearInterval(interval);
    }
  }, [chat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const supportAvailable = useMemo(() => {
    const parseTime = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const start = parseTime(supportStartTime);
    const end = parseTime(supportEndTime);
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();

    if (start <= end) {
      return current >= start && current < end;
    }
    return current >= start || current < end;
  }, [supportStartTime, supportEndTime]);

  const statusLabel = useMemo(() => {
    if (canAdminChat && isAdminPage) {
      return 'Admin assistant';
    }
    if (!chat) return chatEnabled ? 'No active chat' : 'Live chat disabled';
    if (chat.status === 'closed') return 'Closed';
    if (chat.escalated) return supportAvailable ? 'Connected to Support Specialist' : 'Support Specialist not available';
    return 'Chatting with bot';
  }, [chat, supportAvailable, chatEnabled, canAdminChat, isAdminPage]);

  if (!settingsLoaded) {
    return null;
  }

  if (!chatEnabled && !canAdminChat) {
    return null;
  }

  const badgeCount = messages.filter((msg) => msg.sender !== 'user' && !msg.seen).length;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-xl transition hover:bg-blue-700"
      >
        <span>Chat</span>
        <span className="text-lg">💬</span>
        {badgeCount > 0 && (
          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 w-80 max-w-[calc(100vw-1rem)] rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="rounded-3xl bg-blue-700 p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{botName} Support</p>
                <p className="text-xs text-slate-200/90">{statusLabel}</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full bg-blue-800 p-1 text-white hover:bg-blue-900">✕</button>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading chat…</p>
            ) : !status || status === 'unauthenticated' ? (
              <div>
                <p className="text-sm text-slate-700">Please log in to start chat support.</p>
                <Link href="/login" className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Login to chat
                </Link>
              </div>
            ) : canAdminChat && !isAdminPage ? (
              <p className="text-sm text-slate-700">Admin chatbot is available only inside the admin panel. Open an admin page to use it.</p>
            ) : canAdminChat && isAdminPage ? (
              <>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p>Use this admin assistant to manage products, orders, users, coupons, and settings from the admin panel.</p>
                </div>
                <div className="space-y-3">
                  {adminMessages.map((message, index) => (
                    <div key={`${message.sender}-${index}`} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-3xl p-3 max-w-[85%] ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                        <p className={`text-xs uppercase tracking-wide ${message.sender === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                          {message.sender === 'user' ? 'You' : botName}
                        </p>
                        <p className="mt-1 text-sm break-words">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <div className="mt-3 flex gap-2">
                  <input
                    value={adminInput}
                    onChange={(event) => setAdminInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendAdminMessage();
                      }
                    }}
                    placeholder={`Ask ${botName} about admin tasks...`}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={sendAdminMessage}
                    disabled={!adminInput.trim()}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <span>Send</span>
                    <span className="ml-2 text-lg">➤</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {chat === null && (
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p>Hello! Start a chat to get product help, order guidance, or account support.</p>
                    <button
                      onClick={createChat}
                      disabled={loading}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start Chat
                    </button>
                  </div>
                )}

                {chat && (
                  <>
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div key={message._id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`rounded-3xl p-3 max-w-[85%] ${message.sender === 'user' ? 'bg-blue-600 text-white' : message.sender === 'admin' ? 'bg-emerald-100 text-slate-900' : 'bg-slate-100 text-slate-900'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs uppercase tracking-wide ${message.sender === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>{message.sender === 'user' ? 'You' : message.sender === 'admin' ? 'Agent' : botName}</p>
                              <span className="text-[10px] text-slate-500">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="mt-1 text-sm break-words">{message.message}</p>
                            {message.sender === 'user' && (
                              <p className="mt-2 text-[10px] text-blue-200 opacity-80">{message.seen ? 'Seen' : 'Sent'}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                    {chat.status === 'closed' ? (
                      <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                        <p>This chat has been closed. Start a new chat if you need more help.</p>
                        <button
                          onClick={createChat}
                          disabled={loading}
                          className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Start New Chat
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div className="space-y-2">
                          {!chat.escalated && showSupportOption && (
                            <button
                              type="button"
                              onClick={connectToHuman}
                              disabled={sending || !supportAvailable}
                              className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold text-white ${supportAvailable ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-300 cursor-not-allowed'}`}
                            >
                              {supportAvailable ? 'Request Support Specialist' : 'Support Specialist not available'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!chat) return;
                              setSending(true);
                              setError('');
                              try {
                                const res = await fetch(`/api/chats/${chat._id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'closed' }),
                                });
                                const data = await res.json();
                                if (!res.ok) {
                                  setError(data.error || 'Failed to end chat');
                                  return;
                                }
                                setChat(data.chat);
                              } catch (err) {
                                console.error('End chat failed:', err);
                                setError('Failed to end chat. Please try again.');
                              } finally {
                                setSending(false);
                              }
                            }}
                            disabled={sending}
                            className="w-full rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            End chat
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                sendMessage();
                              }
                            }}
                            placeholder={chat.escalated ? 'Send a message to support...' : 'Ask the bot a question...'}
                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={sendMessage}
                            disabled={!input.trim() || sending}
                            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <span>Send</span>
                            <span className="ml-2 text-lg">➤</span>
                          </button>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
