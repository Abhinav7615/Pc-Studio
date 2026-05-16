'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CallRoom from '@/components/CallRoom';

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

export default function ProfileChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const chatId = Array.isArray(params?.chatId) ? params.chatId[0] : params?.chatId;

  const [chat, setChat] = useState<ConsumerChat | null>(null);
  const [messages, setMessages] = useState<ConsumerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [typingStatus, setTypingStatus] = useState('');
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);

  const otherUser = useMemo(
    () => chat?.participants.find((user) => user._id !== session?.user?.id) ?? null,
    [chat, session?.user?.id]
  );

  const fetchChat = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/consumer-chats/${chatId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setStatusText(errorData.error || 'Unable to load conversation');
        setChat(null);
        return;
      }
      const data = await res.json();
      setChat(data.chat || null);
    } catch (err) {
      console.error(err);
      setStatusText('Unable to load conversation');
      setChat(null);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const res = await fetch(`/api/consumer-chats/${chatId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  }, [chatId]);

  const checkOnlineStatus = useCallback(async (userId: string) => {
    if (!userId) return false;
    try {
      const res = await fetch(`/api/user/online-status?userId=${userId}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.online === true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchChat();
      fetchMessages();
      const refreshInterval = window.setInterval(() => {
        fetchMessages();
        fetchChat();
      }, 5000);
      return () => window.clearInterval(refreshInterval);
    }
  }, [status, router, fetchChat, fetchMessages]);

  useEffect(() => {
    if (otherUser?._id) {
      checkOnlineStatus(otherUser._id).then(setOtherUserOnline);
    } else {
      setOtherUserOnline(false);
    }
  }, [checkOnlineStatus, otherUser]);

  const parseJsonResponse = async (response: Response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Unable to parse response:', error, text);
      return { error: 'Unexpected server response' };
    }
  };

  const sendMessage = async (type: 'text' | 'audio' | 'image' = 'text', content: string, metadata: any = {}) => {
    if (!chatId || !content.trim()) return;
    setStatusText('Sending message...');
    try {
      const res = await fetch(`/api/consumer-chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: content.trim(), metadata }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        setStatusText(data.error || 'Message failed');
        return;
      }
      setNewMessage('');
      setSelectedImage(null);
      setUploadProgress(0);
      setStatusText('');
      await fetchMessages();
      await fetchChat();
    } catch (err) {
      console.error(err);
      setStatusText('Message send failed');
    }
  };

  const acceptChat = async () => {
    if (!chatId) return;
    setStatusText('Accepting chat request...');
    try {
      const res = await fetch(`/api/consumer-chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        setStatusText(data.error || 'Unable to accept chat request');
        return;
      }
      setStatusText('Chat request accepted. You can now continue messaging.');
      await fetchChat();
      await fetchMessages();
    } catch (err) {
      console.error(err);
      setStatusText('Unable to accept chat request');
    }
  };

  const closeConversation = async () => {
    if (!chatId) return;
    setStatusText('Closing conversation...');
    try {
      const res = await fetch(`/api/consumer-chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        setStatusText(data.error || 'Unable to close conversation');
        return;
      }
      setStatusText('Conversation closed.');
      await fetchChat();
      await fetchMessages();
    } catch (err) {
      console.error(err);
      setStatusText('Unable to close conversation');
    }
  };

  const readFileAsDataURL = (file: Blob, onProgress?: (percent: number) => void): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setUploadProgress(0);
      setStatusText('');
    }
  };

  const uploadAndSendAudio = async (blob: Blob) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const dataUrl = await readFileAsDataURL(blob, setUploadProgress);
      await sendMessage('audio', dataUrl, { fileName: `audio_${Date.now()}.webm` });
    } catch (err) {
      console.error(err);
      setStatusText('Failed to upload audio');
    } finally {
      setUploading(false);
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
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setStatusText('Recording audio...');
    } catch (err) {
      console.error(err);
      setStatusText('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setStatusText('Uploading audio...');
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
      console.error(err);
      setStatusText('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleTypingInput = (value: string) => {
    setNewMessage(value);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const timeout = window.setTimeout(() => setTypingStatus(''), 3000);
    setTypingTimeout(timeout);
    if (value.trim()) {
      setTypingStatus('Typing...');
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-50 p-6">Loading conversation...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-[32px] bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                ← Back to profile
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Conversation</h1>
                <p className="mt-1 text-sm text-gray-600">A dedicated mobile-first chat page for customer conversations.</p>
              </div>
            </div>
            {chat && (
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {otherUser ? `${otherUser.name || otherUser.email || otherUser.mobile || 'Customer'}` : 'Chat details'}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] bg-white p-5 shadow-sm border border-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{chat?.participants ? otherUser?.name || otherUser?.email || otherUser?.mobile || 'Conversation' : 'Loading conversation...'}</h2>
                  <p className="mt-1 text-sm text-gray-600">{chat ? `Status: ${chat.status}` : 'Fetching conversation details.'}</p>
                </div>
                {chat?.status === 'pending' && otherUser?._id === session?.user?.id && (
                  <button onClick={acceptChat} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Accept request</button>
                )}
              </div>

              {statusText && <div className="mt-4 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 border border-amber-200">{statusText}</div>}

              {chat && (
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                  <span className="rounded-full bg-slate-100 px-3 py-2">Requested: {chat.requestedAt ? new Date(chat.requestedAt).toLocaleString() : 'Unknown'}</span>
                  {chat.acceptedAt && <span className="rounded-full bg-slate-100 px-3 py-2">Accepted: {new Date(chat.acceptedAt).toLocaleString()}</span>}
                  <span className="rounded-full bg-slate-100 px-3 py-2">Updated: {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'No messages yet'}</span>
                </div>
              )}
            </div>

            <div className="rounded-[32px] bg-white p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Messages</h2>
                  <p className="mt-1 text-sm text-gray-600">Swipe through messages in a dedicated chat experience.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${otherUserOnline ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'}`}>
                  {otherUserOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="mt-5 rounded-[32px] border border-slate-200 bg-slate-50 p-4 max-h-[66vh] overflow-y-auto">
                {loading && <p className="text-sm text-gray-500">Loading chat...</p>}
                {!loading && !chat && <p className="text-sm text-gray-500">Conversation not found or not accessible.</p>}
                {!loading && chat && messages.length === 0 && <p className="text-sm text-gray-500">No messages yet. Start the conversation below.</p>}

                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message._id} className={`rounded-3xl border p-4 ${message.sender === 'user' ? 'border-blue-200 bg-blue-50 self-end ml-auto' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{message.senderName || (message.sender === 'admin' ? 'Admin' : message.sender === 'user' ? 'You' : 'Customer')}</p>
                        <span className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-800">
                        {message.type === 'text' && <p className="whitespace-pre-wrap">{message.content}</p>}
                        {message.type === 'audio' && (
                          <audio controls className="mt-2 w-full max-w-full">
                            <source src={message.content} type={message.metadata?.mimeType || 'audio/webm'} />
                            Your browser does not support audio playback.
                          </audio>
                        )}
                        {message.type === 'image' && (
                          <img src={message.content} alt={message.metadata?.fileName || 'Image message'} className="mt-2 h-auto max-w-full rounded-2xl object-contain" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] bg-white p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Conversation actions</h2>
                  <p className="mt-1 text-sm text-gray-600">Accept, close, or refresh this chat from one place.</p>
                </div>
                <button onClick={fetchChat} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {chat?.status === 'pending' && otherUser?._id === session?.user?.id && (
                  <button onClick={acceptChat} className="rounded-3xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700">Accept chat request</button>
                )}
                {chat?.status !== 'closed' && (
                  <button onClick={closeConversation} className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 hover:bg-red-100">Close conversation</button>
                )}
              </div>
            </div>

            {chat?.status === 'active' && (
              <CallRoom chatId={chatId || ''} role="user" />
            )}

            <div className="rounded-[32px] bg-white p-5 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Send a message</h2>
              <p className="mt-1 text-sm text-gray-600">Type or attach media to continue the conversation.</p>

              <div className="mt-4 space-y-4">
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => handleTypingInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={() => sendMessage('text', newMessage)} disabled={!newMessage.trim()} className="rounded-3xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">Send text</button>
                  <button onClick={isRecording ? stopRecording : startRecording} disabled={uploading} className={`rounded-3xl px-4 py-3 text-white ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-60`}>{isRecording ? 'Stop recording' : 'Record audio'}</button>
                </div>

                <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={uploading} />
                  Upload image
                </label>

                {selectedImage && (
                  <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-900">Selected file: {selectedImage.name}</p>
                    <button onClick={sendImage} disabled={uploading} className="rounded-3xl bg-purple-600 px-4 py-3 text-white hover:bg-purple-700 disabled:opacity-60">Send image</button>
                  </div>
                )}

                {uploading && <p className="text-sm text-slate-600">Uploading... {uploadProgress}%</p>}
                {typingStatus && <p className="text-sm text-slate-600">{typingStatus}</p>}
                {statusText && <p className="text-sm text-slate-600">{statusText}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
