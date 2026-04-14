import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import BusinessSettings from '@/models/BusinessSettings';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const chat = await Chat.findById(chatId)
    .populate('user', 'name email mobile')
    .populate('joinedBy', 'name email');
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  if (session.user.role === 'customer' && chat.user.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ chat }, { status: 200 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: any = {};

  if (body.status) {
    if (!['active', 'closed'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    if (body.status === 'closed') {
      if (session.user.role !== 'admin' && session.user.role !== 'staff') {
        if (session.user.role !== 'customer' || chat.user.toString() !== session.user.id) {
          return NextResponse.json({ error: 'Only the chat owner or admin can close chats' }, { status: 401 });
        }
      }
    } else {
      if (session.user.role !== 'admin' && session.user.role !== 'staff') {
        return NextResponse.json({ error: 'Only admin can update chat status to active' }, { status: 401 });
      }
    }
    updates.status = body.status;
  }

  if (typeof body.escalated === 'boolean') {
    if (session.user.role !== 'customer' && session.user.role !== 'admin' && session.user.role !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role === 'customer' && chat.user.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    updates.escalated = body.escalated;
  }

  if (body.status === 'closed' && chat.status !== 'closed' && (session.user.role === 'admin' || session.user.role === 'staff')) {
    const settings = await BusinessSettings.findOne();
    const endMessage = settings?.chatEndMessage?.trim() || 'Thank you for chatting with us. If you need anything else, we are here to help!';

    await Message.create({ chat: chat._id, sender: 'admin', message: endMessage, seen: false });
    updates.lastMessageAt = new Date();
  }

  if (body.join === true) {
    if (session.user.role !== 'admin' && session.user.role !== 'staff') {
      return NextResponse.json({ error: 'Only admin or staff can join chats' }, { status: 401 });
    }
    if (!chat.escalated) {
      return NextResponse.json({ error: 'Chat has not been escalated to a Support Specialist' }, { status: 400 });
    }
    if (!chat.joinedAt) {
      const settings = await BusinessSettings.findOne();
      const joinMessage = settings?.chatJoinMessage?.trim() || 'An agent has joined your chat and will respond shortly.';
      const joinNotice = await Message.create({ chat: chat._id, sender: 'admin', message: joinMessage, seen: false });

      await createNotification({
        userId: chat.user.toString(),
        type: 'admin-message',
        message: joinMessage,
        meta: { chatId: chat._id.toString(), joinedBy: session.user.id, joinedAt: new Date() },
      });

      updates.joinedBy = session.user.id;
      updates.joinedAt = new Date();
      updates.lastMessageAt = new Date();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  Object.assign(chat, updates);
  chat.lastMessageAt = updates.lastMessageAt || new Date();
  await chat.save();

  const populatedChat = await Chat.findById(chat._id)
    .populate('user', 'name email mobile')
    .populate('joinedBy', 'name email');

  return NextResponse.json({ chat: populatedChat }, { status: 200 });
}
