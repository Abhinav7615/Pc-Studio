'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { buildAdminGreeting, generateAdminBotResponse } from '@/lib/chatBot';

interface ChatItem {
  _id: string;
  status: 'active' | 'closed';
  escalated: boolean;
  joinedAt?: string;
  requestedByAdmin?: string;
}

interface MessageItem {
  _id: string;
  sender: 'user' | 'admin' | 'bot';
  message: string;
  seen: boolean;
  delivered?: boolean;
  createdAt: string;
}

interface AdminMessage {
  sender: 'user' | 'bot';
  message: string;
}

export default function ChatWidget() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [botName, setBotName] = useState('ShopBot');
  const [_botEnabled, setBotEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showSupportOption, setShowSupportOption] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [supportStartTime, setSupportStartTime] = useState('09:00');
  const [supportEndTime, setSupportEndTime] = useState('17:00');
  const [input, setInput] = useState('');
  const [adminInput, setAdminInput] = useState('');
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState<'mouse' | 'touch' | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const canAdminChat = status === 'authenticated' && (session?.user?.role === 'admin' || session?.user?.role === 'staff');
  const canCustomerChat = status === 'authenticated' && session?.user?.role === 'customer';
  const canChat = canCustomerChat || (canAdminChat && isAdminPage);

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('chatWidgetPosition');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Default position: bottom right for mobile, adjust for desktop
      const isMobile = window.innerWidth < 768;
      setPosition({
        x: isMobile ? window.innerWidth - 120 : window.innerWidth - 120,
        y: isMobile ? window.innerHeight - 120 : window.innerHeight - 120
      });
    }
  }, []);

  // Handle pointer down for dragging (mouse + touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(e.pointerType === 'touch' ? 'touch' : 'mouse');
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType('touch');
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      setDragOffset({
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      });
    }
  };

  // Handle move for dragging
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !widgetRef.current) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const maxX = window.innerWidth - (widgetRef.current.offsetWidth || 100);
      const maxY = window.innerHeight - (widgetRef.current.offsetHeight || 100);

      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !widgetRef.current || !e.touches[0]) return;
      e.preventDefault();

      const newX = e.touches[0].clientX - dragOffset.x;
      const newY = e.touches[0].clientY - dragOffset.y;
      const maxX = window.innerWidth - (widgetRef.current.offsetWidth || 100);
      const maxY = window.innerHeight - (widgetRef.current.offsetHeight || 100);
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragType(null);
      }
    };

    if (isDragging) {
      if (window.PointerEvent) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
      } else {
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handlePointerUp);
        window.addEventListener('touchcancel', handlePointerUp);
      }
    }

    return () => {
      if (window.PointerEvent) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      } else {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handlePointerUp);
        window.removeEventListener('touchcancel', handlePointerUp);
      }
    };
  }, [isDragging, dragOffset]);

  // Update position on window resize (especially for mobile orientation changes)
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const newX = Math.min(position.x, window.innerWidth - 120);
      const newY = Math.min(position.y, window.innerHeight - 120);

      // Ensure widget stays within viewport bounds
      setPosition({
        x: Math.max(0, newX),
        y: Math.max(0, newY)
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [position.x, position.y]);

  const fetchChat = useCallback(async () => {
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
  }, [status]);

  const fetchSettings = useCallback(async () => {
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
  }, []);

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      await markMessagesSeen(chatId);
    } catch (err) {
      console.error('Message fetch failed:', err);
    }
  }, []);

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
    if (isPendingAdminRequest) {
      setError('Please accept the admin chat request before sending messages.');
      return;
    }
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

  const acceptChatRequest = async () => {
    if (!chat) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/chats/${chat._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptJoin: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to accept chat request.');
        return;
      }
      setChat(data.chat);
      await fetchMessages(chat._id);
    } catch (err) {
      console.error('Accept chat request failed:', err);
      setError('Failed to accept chat request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const sendAdminMessage = () => {
    if (!adminInput.trim()) return;
    const messageText = adminInput.trim();
    const updatedMessages: AdminMessage[] = [...adminMessages, { sender: 'user', message: messageText }];
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
  }, [open, status, session, canCustomerChat, fetchChat]);

  useEffect(() => {
    if (open && canAdminChat && isAdminPage && adminMessages.length === 0) {
      setAdminMessages([{ sender: 'bot', message: buildAdminGreeting(botName) }]);
    }
  }, [open, canAdminChat, isAdminPage, adminMessages.length, botName]);

  useEffect(() => {
    if (chat?.status === 'active' && canCustomerChat) {
      const interval = setInterval(() => fetchChat(), 15000); // Increased from 5s to 15s
      return () => clearInterval(interval);
    }
  }, [chat, fetchChat, canCustomerChat]);

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

  const isPendingAdminRequest = Boolean(chat?.escalated && !chat?.joinedAt && chat?.requestedByAdmin);
  const showJoinChatOption = Boolean(isPendingAdminRequest);

  const statusLabel = useMemo(() => {
    if (canAdminChat && isAdminPage) {
      return 'Admin assistant';
    }
    if (!chat) return chatEnabled ? 'No active chat' : 'Live chat disabled';
    if (chat.status === 'closed') return 'Closed';
    if (chat.escalated) {
      if (chat.requestedByAdmin) {
        return chat.joinedAt ? 'Agent joined the chat' : 'Agent requested chat';
      }
      return supportAvailable ? 'Connected to Support Specialist' : 'Support Specialist not available';
    }
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
    <div
      ref={widgetRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onMouseDown={handlePointerDown as any}
        onClick={(e) => {
          if (!isDragging) {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-xl transition hover:bg-blue-700 active:scale-95 touch-manipulation"
        style={{
          userSelect: 'none',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none'
        }}
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
        <div className="absolute mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-200 bg-white shadow-2xl left-0 right-0 mx-auto md:left-auto md:right-0 md:mx-0" style={{ pointerEvents: 'auto', zIndex: 9999 }}>
          <div className="rounded-3xl bg-blue-700 p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{botName} Support</p>
                <p className="text-xs text-slate-200/90">{statusLabel}</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full bg-blue-800 p-1 text-white hover:bg-blue-900 touch-manipulation">✕</button>
            </div>
          </div>

          <div className="max-h-[50vh] md:max-h-[380px] overflow-y-auto p-4 space-y-3">
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
                              <p className="mt-2 text-[10px] text-blue-200 opacity-80">{message.delivered ? (message.seen ? 'Seen' : 'Delivered') : 'Sent'}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    {isPendingAdminRequest && (
                      <div className="rounded-3xl bg-orange-50 p-4 text-sm text-orange-700 border border-orange-200">
                        <p>A support agent has requested to chat with you.</p>
                        <p className="mt-1 text-xs text-orange-600">Click Join chat with requested admin to accept and continue the conversation.</p>
                      </div>
                    )}

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
                          {showJoinChatOption && (
                            <button
                              type="button"
                              onClick={acceptChatRequest}
                              disabled={sending}
                              className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Join chat with requested admin
                            </button>
                          )}
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
                            placeholder={isPendingAdminRequest ? 'Accept the admin request to continue...' : chat.escalated ? 'Send a message to support...' : 'Ask the bot a question...'}
                            disabled={isPendingAdminRequest}
                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            onClick={sendMessage}
                            disabled={!input.trim() || sending || isPendingAdminRequest}
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
