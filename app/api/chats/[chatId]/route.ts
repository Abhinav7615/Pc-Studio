import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import BusinessSettings from '@/models/BusinessSettings';
import User from '@/models/User';
import { createNotificationAndPush } from '@/lib/notifications';
import { sendEmail } from '@/lib/sendEmail';

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const chat = await Chat.findById(chatId)
    .populate('user', 'name email mobile importantConsumer')
    .populate('joinedBy', 'name email')
    .populate('requestedByAdmin', 'name email');
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

    await Message.create({ chat: chat._id, sender: 'admin', content: endMessage, seen: false });
    updates.lastMessageAt = new Date();
  }

  if (body.join === true) {
    if (session.user.role !== 'admin' && session.user.role !== 'staff') {
      return NextResponse.json({ error: 'Only admins can join chats' }, { status: 401 });
    }
    if (!chat.escalated) {
      return NextResponse.json({ error: 'This chat is not escalated for joining' }, { status: 400 });
    }
    if (chat.joinedAt) {
      return NextResponse.json({ error: 'Chat has already been joined' }, { status: 400 });
    }

    updates.joinedBy = session.user.id;
    updates.joinedAt = new Date();
    updates.autoJoined = false;
    updates.lastMessageAt = new Date();

    await Message.create({
      chat: chat._id,
      sender: 'bot',
      content: 'An agent has joined the chat and will respond shortly.',
      seen: false,
    });

    const targetUser = await User.findById(chat.user);
    if (targetUser?.email) {
      await sendEmail(
        targetUser.email,
        'Support Specialist joined your chat',
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111;">A support specialist has joined your chat</h2>
          <p>Hi ${targetUser.name || 'Customer'},</p>
          <p>An agent has joined your requested chat and will respond shortly. Open the chat to continue the conversation.</p>
          <p style="font-size: 14px; color: #555;">If you need further assistance, reply in the chat window.</p>
          <p>Thank you,</p>
          <p style="font-size: 12px; color: #666;">Refurbished PC Studio Support</p>
        </div>`,
        `A support specialist has joined your chat. Open the chat to continue the conversation.`
      );
    }

    if (targetUser?._id) {
      await createNotificationAndPush({
        userId: targetUser._id.toString(),
        type: 'admin-message',
        message: `An agent has joined your chat ${chat._id}.`,
        meta: { chatId: chat._id.toString(), joinedAt: new Date() },
      });
    }
  }

  if (body.acceptJoin === true) {
    if (session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Only the chat customer can accept a chat request' }, { status: 401 });
    }
    if (chat.user.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!chat.escalated) {
      return NextResponse.json({ error: 'No active chat request to accept' }, { status: 400 });
    }
    if (chat.joinedAt) {
      return NextResponse.json({ error: 'Chat has already been joined' }, { status: 400 });
    }
    if (!chat.requestedByAdmin) {
      return NextResponse.json({ error: 'No requesting admin found for this chat' }, { status: 400 });
    }

    updates.joinedBy = chat.requestedByAdmin;
    updates.joinedAt = new Date();
    updates.autoJoined = false;
    updates.lastMessageAt = new Date();

    const joinNotice = await Message.create({
      chat: chat._id,
      sender: 'bot',
      content: 'Customer accepted the requested chat. An agent can now reply.',
      seen: false,
    });

    await createNotificationAndPush({
      userId: chat.requestedByAdmin.toString(),
      type: 'admin-message',
      message: `Customer accepted your requested chat ${chat._id}.`,
      meta: { chatId: chat._id.toString(), acceptedAt: new Date() },
    });

    updates.lastMessageAt = new Date();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  Object.assign(chat, updates);
  chat.lastMessageAt = updates.lastMessageAt || new Date();
  await chat.save();

  const populatedChat = await Chat.findById(chat._id)
    .populate('user', 'name email mobile')
    .populate('joinedBy', 'name email')
    .populate('requestedByAdmin', 'name email');

  return NextResponse.json({ chat: populatedChat }, { status: 200 });
}
