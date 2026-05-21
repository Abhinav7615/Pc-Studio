import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { isValidObjectId } from 'mongoose';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import User from '@/models/User';
import BusinessSettings from '@/models/BusinessSettings';
import { createNotificationAndPush } from '@/lib/notifications';
import { sendEmail } from '@/lib/sendEmail';

async function findCustomer(identifier: string) {
  if (!identifier) return null;
  const normalized = identifier.trim();
  if (!normalized) return null;

  let query: any;
  if (isValidObjectId(normalized)) {
    query = { _id: normalized };
  } else {
    const emailRegex = new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const digits = normalized.replace(/\D/g, '');
    const normalizedMobile = digits.length === 10
      ? digits
      : digits.length === 12 && digits.startsWith('91')
        ? digits.slice(-10)
        : '';
    const mobileQuery = normalizedMobile
      ? [
          { mobile: normalizedMobile },
          { mobile: new RegExp(`(?:\\+?91)?${normalizedMobile}$`) },
        ]
      : [];
    query = {
      $or: [
        { email: emailRegex },
        { customerId: emailRegex },
        ...mobileQuery,
      ],
    };
  }

  const user = await User.findOne({ role: 'customer', ...query });
  return user;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  if (session.user.role === 'admin' || session.user.role === 'staff') {
    const chats = await Chat.find({ type: 'consumer' }).sort({ updatedAt: -1 })
      .populate('participants', 'name email mobile customerId')
      .populate('targetUser', 'name email mobile customerId')
      .populate('user', 'name email mobile customerId');

    return NextResponse.json({ chats }, { status: 200 });
  }

  const chats = await Chat.find({ type: 'consumer', participants: session.user.id }).sort({ updatedAt: -1 })
    .populate('participants', 'name email mobile customerId')
    .populate('targetUser', 'name email mobile customerId')
    .populate('user', 'name email mobile customerId');

  return NextResponse.json({ chats }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'customer') {
    return NextResponse.json({ error: 'Only customers can use consumer chat requests' }, { status: 401 });
  }

  await dbConnect();

  const settings = await BusinessSettings.findOne();
  if (settings?.consumerChatEnabled === false) {
    return NextResponse.json({ error: 'Customer-to-customer chat is currently disabled.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetIdentifier = typeof body.targetIdentifier === 'string' ? body.targetIdentifier.trim() : '';
    const requestMessage = typeof body.message === 'string' ? body.message.trim() : '';

    if (!targetIdentifier) {
      return NextResponse.json({ error: 'Target customer identifier is required' }, { status: 400 });
    }

    const targetUser = await findCustomer(targetIdentifier);
    if (!targetUser || targetUser.role !== 'customer') {
      return NextResponse.json({ error: 'Target customer not found' }, { status: 404 });
    }

    if (targetUser._id.toString() === session.user.id) {
      return NextResponse.json({ error: 'Cannot send a chat request to yourself' }, { status: 400 });
    }

    const requester = await User.findById(session.user.id);
    if (!requester) {
      return NextResponse.json({ error: 'Requester not found' }, { status: 404 });
    }

    let consumerChat = await Chat.findOne({
      type: 'consumer',
      participants: { $all: [requester._id, targetUser._id] },
      status: { $in: ['pending', 'active'] },
    });

    if (!consumerChat) {
      consumerChat = await Chat.create({
        user: requester._id,
        type: 'consumer',
        participants: [requester._id, targetUser._id],
        targetUser: targetUser._id,
        status: 'pending',
        requestedAt: new Date(),
        lastMessageAt: new Date(),
      });
    } else {
      consumerChat.requestedAt = consumerChat.requestedAt || new Date();
      consumerChat.lastMessageAt = new Date();
      await consumerChat.save();
    }

    const messageText = requestMessage || `${requester.name || 'A customer'} has invited you to chat.`;
    await Message.create({
      chat: consumerChat._id,
      sender: 'user',
      senderId: requester._id,
      senderName: requester.name || 'Customer',
      type: 'text',
      content: messageText,
      seen: false,
    });

    await createNotificationAndPush({
      userId: targetUser._id.toString(),
      type: 'user-action',
      message: `${requester.name || 'A customer'} sent you a chat request.`,
      meta: { chatId: consumerChat._id.toString(), fromUserId: requester._id.toString() },
    });

    const targetEmail = targetUser.email || settings?.businessEmail || process.env.EMAIL_USER;
    if (targetEmail) {
      try {
        await sendEmail(
          targetEmail,
          'New chat request from another customer',
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
             <h2 style="color: #111;">New consumer chat request</h2>
             <p>Hi ${targetUser.name || 'there'},</p>
             <p>${requester.name || 'A customer'} has requested to chat with you.</p>
             ${requestMessage ? `<p style="font-size: 14px; color: #555;">Message: ${requestMessage}</p>` : ''}
             <p>Please open your account to accept the chat request and continue the conversation.</p>
           </div>`,
          `You have a new chat request from ${requester.name || 'another customer'}.`
        );
      } catch (emailError) {
        console.error('[consumer-chats POST] Email send failed:', emailError);
      }
    }

    const messages = await Message.find({ chat: consumerChat._id }).sort({ createdAt: 1 });
    const populatedChat = await Chat.findById(consumerChat._id)
      .populate('participants', 'name email mobile customerId')
      .populate('targetUser', 'name email mobile customerId')
      .populate('user', 'name email mobile customerId');

    return NextResponse.json({ chat: populatedChat, messages }, { status: 201 });
  } catch (error) {
    console.error('[consumer-chats POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Unable to create consumer chat request. Please try again.' }, { status: 500 });
  }
}
