import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { chatId } = await params;

  await dbConnect();
  const chat = await Chat.findById(chatId);
  if (!chat || chat.type !== 'consumer') {
    return NextResponse.json({ error: 'Consumer chat not found' }, { status: 404 });
  }

  const isParticipant = (chat.participants as any[]).some((id) => id.toString() === session.user.id);
  if (!isParticipant && session.user.role !== 'admin' && session.user.role !== 'staff') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });
  return NextResponse.json({ messages }, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { chatId } = await params;
  await dbConnect();

  const chat = await Chat.findById(chatId);
  if (!chat || chat.type !== 'consumer') {
    return NextResponse.json({ error: 'Consumer chat not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === 'string' ? body.type : 'text';
  const content = typeof body.content === 'string'
    ? body.content.trim()
    : typeof body.message === 'string'
    ? body.message.trim()
    : '';
  const metadata = body.metadata || {};

  if (!content && type === 'text') {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }
  if (type !== 'text' && !content) {
    return NextResponse.json({ error: 'Content URL is required for audio/image messages' }, { status: 400 });
  }

  const isParticipant = (chat.participants as any[]).some((id) => id.toString() === session.user.id);
  if (!isParticipant && session.user.role !== 'admin' && session.user.role !== 'staff') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await BusinessSettings.findOne();
  if (settings?.consumerChatEnabled === false && session.user.role === 'customer') {
    return NextResponse.json({ error: 'Consumer-to-consumer chat is currently disabled by the admin.' }, { status: 403 });
  }

  const senderType = session.user.role === 'admin' || session.user.role === 'staff' ? 'admin' : 'user';
  const isRequester = chat.user.toString() === session.user.id;

  if (chat.status === 'pending' && session.user.role === 'customer' && !isRequester) {
    return NextResponse.json({ error: 'Cannot send messages until the chat is accepted by the other customer' }, { status: 403 });
  }

  if (chat.status === 'closed' && session.user.role === 'customer') {
    return NextResponse.json({ error: 'Cannot send messages to a closed conversation' }, { status: 403 });
  }
  const senderName = session.user.name || (senderType === 'admin' ? 'Admin' : 'Customer');

  const message = await Message.create({
    chat: chat._id,
    sender: senderType,
    senderId: session.user.id,
    senderName,
    type,
    content,
    metadata,
    seen: false,
  });

  chat.lastMessageAt = new Date();
  await chat.save();

  return NextResponse.json({ message }, { status: 201 });
}
