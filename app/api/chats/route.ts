import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import BusinessSettings from '@/models/BusinessSettings';
import { buildBotGreeting } from '@/lib/chatBot';

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
      .populate('user', 'name email mobile')
      .populate('joinedBy', 'name email');
    return NextResponse.json({ chats }, { status: 200 });
  }

  const userChat = await Chat.findOne({ user: session.user.id, status: 'active' }).sort({ updatedAt: -1 });
  if (!userChat) {
    return NextResponse.json({ chat: null }, { status: 200 });
  }

  const newMessages = await Message.find({ chat: userChat._id }).sort({ createdAt: 1 });
  return NextResponse.json({ chat: userChat, messages: newMessages }, { status: 200 });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const settings = await BusinessSettings.findOne();
  if (settings?.chatEnabled === false) {
    return NextResponse.json({ error: 'Live chat is currently disabled. Please try again later.' }, { status: 403 });
  }

  if (session.user.role !== 'customer') {
    return NextResponse.json({ error: 'Only customers can start chat sessions' }, { status: 403 });
  }

  const existingChat = await Chat.findOne({ user: session.user.id, status: 'active' }).sort({ updatedAt: -1 });
  if (existingChat) {
    const existingMessages = await Message.find({ chat: existingChat._id }).sort({ createdAt: 1 });
    return NextResponse.json({ chat: existingChat, messages: existingMessages }, { status: 200 });
  }

  const chat = await Chat.create({ user: session.user.id, status: 'active', escalated: false });
  const botName = settings?.chatBotName || 'ShopBot';
  const botEnabled = settings?.chatBotEnabled !== false;
  const botMessage = botEnabled
    ? (settings?.chatBotIntroMessage?.trim() || buildBotGreeting(botName))
    : 'The AI assistant is currently offline. A human agent will join shortly.';

  await Message.create({ chat: chat._id, sender: 'bot', message: botMessage, seen: false });
  const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });

  return NextResponse.json({ chat, messages }, { status: 201 });
}
