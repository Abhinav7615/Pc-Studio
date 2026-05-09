import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { isValidObjectId } from 'mongoose';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import User from '@/models/User';
import BusinessSettings from '@/models/BusinessSettings';
import { buildBotGreeting } from '@/lib/chatBot';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/sendEmail';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  if (session.user.role === 'admin' || session.user.role === 'staff') {
    const activeOnly = request.nextUrl.searchParams.get('active') === 'true';
    const filter: any = { status: 'active' };
    const chats = await Chat.find(activeOnly ? filter : {}).sort({ updatedAt: -1 })
      .populate('user', 'name email mobile importantConsumer')
      .populate('joinedBy', 'name email')
      .populate('requestedByAdmin', 'name email');
    return NextResponse.json({ chats }, { status: 200 });
  }

  const userChat = await Chat.findOne({ user: session.user.id, status: 'active' }).sort({ updatedAt: -1 });
  if (!userChat) {
    return NextResponse.json({ chat: null }, { status: 200 });
  }

  const newMessages = await Message.find({ chat: userChat._id }).sort({ createdAt: 1 });
  return NextResponse.json({ chat: userChat, messages: newMessages }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const settings = await BusinessSettings.findOne();
  if (settings?.chatEnabled === false) {
    return NextResponse.json({ error: 'Live chat is currently disabled. Please try again later.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const targetIdentifier = typeof body.userId === 'string' ? body.userId.trim() : '';
  const adminMessage = typeof body.adminMessage === 'string' ? body.adminMessage.trim() : '';

  if (session.user.role === 'admin' || session.user.role === 'staff') {
    if (!targetIdentifier) {
      return NextResponse.json({ error: 'Target customer identifier is required for admin chat requests' }, { status: 400 });
    }

    let targetUser = null;
    if (isValidObjectId(targetIdentifier)) {
      targetUser = await User.findById(targetIdentifier);
    }
    if (!targetUser) {
      targetUser = await User.findOne({
        $or: [
          { email: targetIdentifier.toLowerCase() },
          { mobile: targetIdentifier },
          { customerId: targetIdentifier },
        ],
      });
    }

    if (!targetUser || targetUser.role !== 'customer') {
      return NextResponse.json({ error: 'Target user not found or not a customer' }, { status: 404 });
    }
    if (!targetUser || targetUser.role !== 'customer') {
      return NextResponse.json({ error: 'Target user not found or not a customer' }, { status: 404 });
    }

    let chat = await Chat.findOne({ user: targetUser._id, status: 'active' }).sort({ updatedAt: -1 });
    const requestText = adminMessage || 'An admin has requested to chat with you. Please reply here to continue the conversation.';

    if (!chat) {
      chat = await Chat.create({
        user: targetUser._id,
        status: 'active',
        escalated: true,
        autoJoined: false,
        requestedByAdmin: session.user.id,
        requestSentAt: new Date(),
      });
      await Message.create({ chat: chat._id, sender: 'admin', content: requestText, seen: false });
    } else {
      chat.escalated = true;
      chat.autoJoined = false;
      chat.requestedByAdmin = session.user.id;
      chat.requestSentAt = new Date();
      await chat.save();
      await Message.create({ chat: chat._id, sender: 'admin', content: requestText, seen: false });
    }

    await createNotification({
      userId: targetUser._id.toString(),
      type: 'admin-message',
      message: `Admin started a chat request with you. Open your support chat to continue.`,
      meta: { chatId: chat._id.toString(), requestedBy: session.user.id, requestedAt: new Date() },
    });

    const userEmail = targetUser.email || settings?.businessEmail || process.env.EMAIL_USER;
    if (userEmail) {
      await sendEmail(
        userEmail,
        'Admin Chat Request Received',
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
           <h2 style="color: #111;">Chat request from admin</h2>
           <p>Hi ${targetUser.name || 'Customer'},</p>
           <p>An admin has requested a chat with you. Open the live chat on the website to reply and continue the conversation.</p>
           <p style="font-size: 14px; color: #555;">Message: ${requestText}</p>
           <p>Thank you,</p>
           <p style="font-size: 12px; color: #666;">Refurbished PC Studio Support</p>
         </div>`,
        `Admin has requested a chat with you. Message: ${requestText}`
      );
    }

    const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });
    return NextResponse.json({ chat, messages }, { status: 201 });
  }

  if (session.user.role !== 'customer') {
    return NextResponse.json({ error: 'Only customers can start chat sessions' }, { status: 403 });
  }

  const existingChat = await Chat.findOne({ user: session.user.id, status: 'active' }).sort({ updatedAt: -1 });
  if (existingChat) {
    const existingMessages = await Message.find({ chat: existingChat._id }).sort({ createdAt: 1 });
    return NextResponse.json({ chat: existingChat, messages: existingMessages }, { status: 200 });
  }

  const chat = await Chat.create({ user: session.user.id, status: 'active', escalated: false, autoJoined: false });
  const botName = settings?.chatBotName || 'ShopBot';
  const botEnabled = settings?.chatBotEnabled !== false;
  const botMessage = botEnabled
    ? (settings?.chatBotIntroMessage?.trim() || buildBotGreeting(botName))
    : 'The AI assistant is currently offline. A human agent will join shortly.';

  await Message.create({ chat: chat._id, sender: 'bot', content: botMessage, seen: false });
  const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });

  return NextResponse.json({ chat, messages }, { status: 201 });
}
