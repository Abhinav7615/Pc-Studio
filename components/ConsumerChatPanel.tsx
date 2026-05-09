'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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

interface ConsumerMessage {
  _id: string;
  sender: 'user' | 'admin' | 'bot';
  senderId?: string;
  senderName?: string;
  type: 'text' | 'audio' | 'image';
  content: string;
  metadata?: any;
  createdAt: string;
  seen?: boolean;
}

export default function ConsumerChatPanel() {
  const { data: session, status } = useSession();
  const [enabled, setEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConsumerUser[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<ConsumerUser | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [chats, setChats] = useState<ConsumerChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<ConsumerChat | null>(null);
  const [messages, setMessages] = useState<ConsumerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [typingStatus, setTypingStatus] = useState('');
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, boolean>>({});
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/chat-settings');
      if (!res.ok) return;
      const data = await res.json();
      setEnabled(data.consumerChatEnabled !== false);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/consumer-chats');
      if (!res.ok) {
        setChats([]);
        return;
      }
      const data = await res.json();
      const updatedChats = data.chats || [];
      setChats(updatedChats);
      if (!selectedChat && updatedChats.length > 0) {
        setSelectedChat(updatedChats[0]);
      } else if (selectedChat) {
        const matching = updatedChats.find((chat: ConsumerChat) => chat._id === selectedChat._id);
        if (matching) {
          setSelectedChat(matching);
        }
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
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const checkOnlineStatus = useCallback(async (userId: string) => {
    if (!userId) return false;
    try {
      const res = await fetch(`/api/user/online-status?userId=${userId}`);
      if (!res.ok) return false;
      const data = await res.json();
      console.log(`Online status for ${userId}:`, data.online); // Debug log
      return data.online === true;
    } catch (err) {
      console.error('Error checking online status:', err);
      return false;
    }
  }, []);

  const updateParticipantStatuses = useCallback(async (userIds: string[]) => {
    if (!userIds.length) return;
    const statusMap: Record<string, boolean> = {};
    await Promise.all(
      userIds.map(async (userId) => {
        statusMap[userId] = await checkOnlineStatus(userId);
      })
    );
    setParticipantStatuses((prev) => ({ ...prev, ...statusMap }));
    const otherUser = selectedChat?.participants.find((u) => u._id !== session?.user?.id);
    if (otherUser) {
      setOtherUserOnline(statusMap[otherUser._id] ?? false);
    }
  }, [checkOnlineStatus, selectedChat, session?.user?.id]);

  const updateMyStatus = useCallback(async () => {
    try {
      await fetch('/api/user/online-status', { method: 'POST' });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadSettings();
      loadChats();
      updateMyStatus();

      const statusInterval = setInterval(() => updateMyStatus(), 30000); // 30s for presence updates
      const chatListInterval = setInterval(() => loadChats(), 8000); // 8s for chat list refresh

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          updateMyStatus();
          loadChats();
        }
      };

      const handleFocus = () => {
        updateMyStatus();
      };

      const handleBeforeUnload = () => {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/user/online-status');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearInterval(statusInterval);
        clearInterval(chatListInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [status, loadSettings, loadChats, updateMyStatus]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
      const otherUser = selectedChat.participants.find((u) => u._id !== session?.user?.id);
      if (otherUser) {
        updateParticipantStatuses([otherUser._id]);
      }

      const refreshInterval = setInterval(() => {
        loadMessages(selectedChat._id);
        if (otherUser) {
          updateParticipantStatuses([otherUser._id]);
        }
      }, 5000); // 5s for message refresh (faster delivery)

      return () => clearInterval(refreshInterval);
    }

    setMessages([]);
    setOtherUserOnline(false);
  }, [selectedChat, loadMessages, updateParticipantStatuses, session?.user?.id]);

  const searchCustomers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setStatusText('Searching customers...');
    try {
      const res = await fetch(`/api/consumer-chats/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) {
        setSearchResults([]);
        setStatusText('Unable to search customers');
        return;
      }
      const data = await res.json();
      setSearchResults(data.users || []);
      setStatusText((data.users || []).length ? '' : 'No customers found');
    } catch (err) {
      console.error(err);
      setStatusText('Search failed');
    }
  };

  const parseJsonResponse = async (response: Response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError, text);
      return { error: 'Unexpected server response. Please try again.' };
    }
  };

  const readFileAsDataURL = (file: Blob, onProgress?: (percent: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onProgress?.(100);
          resolve(reader.result);
        } else {
          reject(new Error('Unable to read file as data URL'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendChatRequest = async (targetIdentifier: string) => {
    if (!targetIdentifier.trim()) {
      setRequestStatus('Please select a target customer');
      return;
    }
    setRequestStatus('Sending chat request...');
    try {
      const res = await fetch('/api/consumer-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetIdentifier: targetIdentifier.trim(), message: requestMessage.trim() }),
      });

      const data: any = await parseJsonResponse(res);
      if (!res.ok) {
        setRequestStatus(data.error || `Failed to send chat request (${res.status})`);
        return;
      }
      setRequestStatus('Chat request sent successfully.');
      setSelectedTarget(null);
      setSearchQuery('');
      setRequestMessage('');
      setSearchResults([]);
      await loadChats();
      if (data.chat) {
        setSelectedChat(data.chat);
        loadMessages(data.chat._id);
      }
    } catch (err) {
      console.error(err);
      setRequestStatus('Unable to send chat request.');
    }
  };

  const acceptChat = async (chatId: string) => {
    setStatusText('Accepting chat request...');
    try {
      const res = await fetch(`/api/consumer-chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      const data: any = await parseJsonResponse(res);
      if (!res.ok) {
        setStatusText(data.error || `Unable to accept chat request (${res.status})`);
        return;
      }
      setStatusText('Chat request accepted. You may now chat.');
      await loadChats();
      if (data.chat) {
        setSelectedChat(data.chat);
        loadMessages(data.chat._id);
      }
    } catch (err) {
      console.error(err);
      setStatusText('Unable to accept chat request.');
    }
  };

  const closeConversation = async () => {
    if (!selectedChat) return;
    setStatusText('Closing conversation...');
    try {
      const res = await fetch(`/api/consumer-chats/${selectedChat._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      const data: any = await parseJsonResponse(res);
      if (!res.ok) {
        setStatusText(data.error || `Unable to close conversation (${res.status})`);
        return;
      }
      setStatusText('Conversation closed.');
      await loadChats();
      if (data.chat) {
        setSelectedChat(data.chat);
        loadMessages(data.chat._id);
      }
    } catch (err) {
      console.error(err);
      setStatusText('Unable to close conversation.');
    }
  };

  const sendMessage = async (type: 'text' | 'audio' | 'image' = 'text', content: string, metadata: any = {}) => {
    if (!selectedChat || !content.trim()) return;
    const isRequester = selectedChat.user._id === session?.user?.id;
    if (selectedChat.status === 'pending' && !isRequester) {
      setStatusText('Waiting for the other customer to accept before sending messages.');
      return;
    }
    if (selectedChat.status === 'closed') {
      setStatusText('Conversation is closed.');
      return;
    }
    setStatusText('Sending message...');
    setTypingStatus('');
    try {
      const res = await fetch(`/api/consumer-chats/${selectedChat._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: content.trim(), metadata }),
      });
      const data: any = await parseJsonResponse(res);
      if (!res.ok) {
        setStatusText(data.error || 'Message failed');
        return;
      }
      setNewMessage('');
      setStatusText('');
      setUploadProgress(0);
      setOtherUserOnline(true);
      setTimeout(() => {
        setTypingStatus(`${selectedChat.participants.find((u) => u._id !== session?.user?.id)?.name || 'User'} is typing...`);
        setTimeout(() => setTypingStatus(''), 2000);
      }, 1000);
      await loadMessages(selectedChat._id);
      await loadChats();
    } catch (err) {
      console.error(err);
      setStatusText('Message send failed');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await uploadAndSendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setStatusText('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadAndSendAudio = async (blob: Blob) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const dataUrl = await readFileAsDataURL(blob, setUploadProgress);
      await sendMessage('audio', dataUrl, { fileName: `audio_${Date.now()}.webm`, duration: 0 });
    } catch (err) {
      console.error('Error uploading audio:', err);
      setStatusText('Failed to upload audio');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const sendImage = async () => {
    if (!selectedImage) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const dataUrl = await readFileAsDataURL(selectedImage, setUploadProgress);
      await sendMessage('image', dataUrl, {
        fileName: selectedImage.name,
        size: selectedImage.size,
        mimeType: selectedImage.type,
      });
      setSelectedImage(null);
    } catch (err) {
      console.error('Error uploading image:', err);
      setStatusText('Failed to upload image');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setUploadProgress(0);
    }
  };
    
  const handleTypingInput = (value: string) => {
    setNewMessage(value);
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    // Send typing indicator logic would go here
    
    const timeout = setTimeout(() => {
      setTypingStatus('');
    }, 3000);
    setTypingTimeout(timeout);
  };

  const isRequester = selectedChat?.user?._id === session?.user?.id;

  if (status !== 'authenticated') {
    return null;
  }

  if (!enabled) {
    return (
      <div className="mt-8 max-w-5xl mx-auto px-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">👥 Customer-to-Customer Chat</h2>
          <p className="mt-3 text-gray-600">This feature is currently disabled by the admin. Once enabled, you will be able to search other customers and start private conversations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 max-w-6xl mx-auto px-4">
      <div className="rounded-[32px] bg-white border border-gray-200 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)] p-6">
        <div className="mb-8 rounded-3xl border border-gray-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Customer conversation</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Customer-to-Customer Chat</h2>
          <p className="mt-3 max-w-2xl text-gray-600">Search a customer by email, mobile, or customer ID, then send a chat request to start a direct conversation.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Find a customer</h3>
                  <p className="text-sm text-gray-600">Search and select a customer to request a private chat.</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Quick access</span>
              </div>
              <label className="block text-gray-700 font-semibold">Search customer by email, mobile, or customer ID</label>
              <div className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type email, mobile, or ID"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={searchCustomers} className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Search</button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700 font-medium">Select a customer to send a chat request</p>
                {searchResults.map((customer) => (
                  <div key={customer._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">{customer.name || 'Unnamed customer'}</p>
                      <p className="text-sm text-gray-600">{customer.email || 'No email'} &middot; {customer.mobile}</p>
                      <p className="text-sm text-gray-500">ID: {customer.customerId || 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedTarget(customer); setRequestStatus(''); }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Request details</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Selected customer</label>
                  <div className="min-h-[60px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700">
                    {selectedTarget ? (
                      <div>
                        <p className="font-semibold">{selectedTarget.name || 'Unnamed customer'}</p>
                        <p className="text-sm text-gray-600">{selectedTarget.email || 'No email'} · {selectedTarget.mobile}</p>
                      </div>
                    ) : (
                      <span className="text-gray-500">No customer selected yet.</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Optional request message</label>
                  <textarea
                    rows={3}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Add a short note for the customer"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => sendChatRequest(selectedTarget?.customerId || selectedTarget?._id || searchQuery)}
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700"
                >
                  Send chat request
                </button>
                {requestStatus && <p className="text-sm text-gray-700">{requestStatus}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Your conversations</h3>
                  <p className="text-sm text-gray-600">Manage requests and continue active chats.</p>
                </div>
                <button onClick={loadChats} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
              </div>

              <div className="mt-4 space-y-3">
                {loading && <p className="text-sm text-gray-500">Loading chats...</p>}
                {!loading && chats.length === 0 && <p className="text-sm text-gray-500">No consumer conversations yet.</p>}
                {chats.map((chat) => {
                  const isPending = chat.status === 'pending';
                  const isActive = chat.status === 'active';
                  const otherUser = chat.participants.find((u) => u._id !== session?.user?.id);
                  return (
                    <div
                      key={chat._id}
                      className={`rounded-3xl border p-4 transition ${selectedChat?._id === chat._id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{otherUser?.name || otherUser?.email || otherUser?.mobile || 'Customer'}</p>
                          <p className="text-sm text-gray-600">{otherUser?.customerId ? `ID: ${otherUser.customerId}` : ''}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-green-100 text-green-800' : isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                          {chat.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span>{chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'No updates yet'}</span>
                        {chat.acceptedAt && <span>· accepted {new Date(chat.acceptedAt).toLocaleString()}</span>}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {isPending && chat.targetUser && chat.targetUser._id === session?.user?.id && (
                          <button onClick={() => acceptChat(chat._id)} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Accept request</button>
                        )}
                        <Link
                          href={`/profile/chat/${chat._id}`}
                          onClick={() => setSelectedChat(chat)}
                          className="rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 hover:bg-gray-50"
                        >
                          Open chat
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Dedicated chat view</h3>
              <p className="mt-1 text-sm text-gray-600">Open any conversation in a dedicated chat page with back navigation and a mobile-first layout.</p>
            </div>
            <div className="text-sm text-slate-600">Select a chat and tap “Open chat” to continue.</div>
          </div>
          {selectedChat && (
            <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Selected conversation</p>
                  <h4 className="mt-1 text-lg font-semibold text-gray-900">{selectedChat.participants.find((u) => u._id !== session?.user?.id)?.name || 'Customer'}</h4>
                  <p className="mt-1 text-sm text-gray-600">{selectedChat.status === 'pending' ? 'Pending acceptance' : selectedChat.status === 'active' ? 'Active conversation' : 'Closed conversation'}</p>
                </div>
                <Link href={`/profile/chat/${selectedChat._id}`} className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                  Open conversation
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
