import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import BusinessSettings from '@/models/BusinessSettings';
import User from '@/models/User';
import Order from '@/models/Order';
import SecretKey from '@/models/SecretKey';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/sendEmail';
import { generateBotResponse, shouldEscalateToHuman } from '@/lib/chatBot';

function isWithinVerificationWindow(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return true;
  const parse = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start = parse(startTime);
  const end = parse(endTime);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  if (start <= end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
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

  const chatUserId = (chat.user as any)?._id ? (chat.user as any)._id.toString() : chat.user.toString();
  if (session.user.role === 'customer' && chatUserId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const markSender = session.user.role === 'customer' ? 'admin' : 'user';
  await Message.updateMany({ chat: chat._id, sender: markSender, delivered: false }, { $set: { delivered: true } });

  const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });
  return NextResponse.json({ messages }, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const escalate = body.escalate === true;
  let messageText = String(body.message || '').trim();

  if (!messageText) {
    if (escalate) {
      messageText = 'Please connect me to human support.';
    } else {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }
  }

  await dbConnect();
  const chat = await Chat.findById(chatId).populate('user', 'name email');
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  if (chat.status === 'closed') {
    return NextResponse.json({ error: 'Chat is closed' }, { status: 400 });
  }

  let sender: 'user' | 'admin' | 'bot';
  if (session.user.role === 'admin' || session.user.role === 'staff') {
    sender = 'admin';
  } else {
    const chatUserId = (chat.user as any)?._id ? (chat.user as any)._id.toString() : chat.user.toString();
    if (chatUserId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    sender = 'user';
  }

  if (sender === 'user') {
    const lastUserMessage = await Message.findOne({ chat: chat._id, sender: 'user' }).sort({ createdAt: -1 });
    if (lastUserMessage && Date.now() - new Date(lastUserMessage.createdAt).getTime() < 3000) {
      return NextResponse.json({ error: 'You are sending messages too quickly. Please wait a moment.' }, { status: 429 });
    }
  }

  const _newMessage = await Message.create({ chat: chat._id, sender, message: messageText, seen: false });
  chat.lastMessageAt = new Date();

  let botReply = null;
  let escalationRequested = false;
  let showSupportOption = false;

  if (sender === 'user' && !chat.escalated) {
    const settings = await BusinessSettings.findOne();
    const botEnabled = settings?.chatBotEnabled !== false;
    const botName = settings?.chatBotName || 'ShopBot';
    const shouldEscalate = escalate || shouldEscalateToHuman(messageText);
    const supportAvailable = isWithinVerificationWindow(settings?.paymentVerificationStartTime, settings?.paymentVerificationEndTime);
    const user = await User.findById(session.user.id);
    const isImportant = Boolean(user?.importantConsumer);

    // Check for secret key first
    const secretCode = messageText.trim().toUpperCase();
    const secretKey = await SecretKey.findOne({ code: secretCode, isActive: true });
    const isSecretKey = !!secretKey;
    const shouldForceJoin = isImportant || isSecretKey;

    if (shouldEscalate && !supportAvailable && !shouldForceJoin) {
      showSupportOption = true;
      const botMessage = await Message.create({
        chat: chat._id,
        sender: 'bot',
        message: `Support Specialist is not available right now. Please try again between ${settings?.paymentVerificationStartTime || '09:00'} and ${settings?.paymentVerificationEndTime || '17:00'}.`,
        seen: false,
      });
      botReply = botMessage;
    } else {
      if (shouldEscalate || isSecretKey) {
        escalationRequested = true;
        chat.escalated = true;
        if (isSecretKey) {
          chat.autoJoined = true;
          chat.joinedAt = new Date();
          chat.joinedBy = secretKey!.createdBy;
          chat.requestedByAdmin = secretKey!.createdBy;
        }

        const adminNotificationText = isSecretKey
          ? `URGENT: Customer entered secret key "${secretCode}". Immediate admin connection required for chat ${chat._id}.`
          : `A customer has requested a Support Specialist in chat ${chat._id}. Please respond in Live Chat.`;

        await createNotification({
          userId: isSecretKey ? secretKey!.createdBy : null,
          type: 'admin-message',
          message: adminNotificationText,
          meta: { chatId: chat._id.toString(), userId: session.user.id, escalatedAt: new Date(), secretKey: isSecretKey ? secretCode : undefined, importantConsumer: isImportant ? true : undefined },
        });

        const settingsEmail = settings?.businessEmail || settings?.contactEmail || process.env.EMAIL_USER;
        if (settingsEmail) {
          await sendEmail(
            settingsEmail,
            isSecretKey ? 'Urgent support request from secret key user' : 'Support request from important customer',
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <h2 style="color: #111;">Support request received</h2>
               <p>A ${isSecretKey ? 'secret-key' : isImportant ? 'important' : 'standard'} customer has requested support.</p>
               <p>Chat ID: ${chat._id}</p>
               <p>Open the admin live chat panel to respond immediately.</p>
             </div>`,
            `Customer support request received for chat ${chat._id}`
          );
        }
      }

      if (botEnabled) {
        const history = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });
        const historyMessages = history.map((item) => ({ sender: item.sender, message: item.message }));
        const lowerMessage = messageText.toLowerCase();

        let botResult = null;
        const wantsReferral = /\b(referral|referal|refer|invite code|referral code|referral link|invite link|mera code|my code|mera referral)\b/.test(lowerMessage);
        const wantsLastOrder = /\b(last order|pichla order|aakhri order|last order status|mera last order|order status)\b/.test(lowerMessage);

        if (!isSecretKey && !shouldEscalate && wantsReferral) {
          const referralCode = user?.referralCode;
          botResult = {
            text: referralCode
              ? `Aapka referral code hai: ${referralCode}. Is code ko apne doston ke saath share karke unko discount aur aapko rewards mil sakte hain.`
              : 'Aapka referral code abhi generate nahi hua hai. Kripya apne account mein jaakar referral code generate karein.',
            fallback: false,
          };
        } else if (!isSecretKey && !shouldEscalate && wantsLastOrder) {
          const lastOrder = await Order.findOne({ customer: session.user.id }).sort({ createdAt: -1 });
          botResult = {
            text: lastOrder
              ? `Aapka last order #${lastOrder.orderNumber} abhi '${lastOrder.status}' mein hai.${lastOrder.trackingId ? ` Tracking ID: ${lastOrder.trackingId}.` : ''}`
              : 'Mujhe aapka koi recent order nahin mila. Kripya apne My Orders page par dekhein ya naya order place karein.',
            fallback: false,
          };
        } else if (isSecretKey) {
          await SecretKey.updateOne({ _id: secretKey!._id }, { $inc: { usedCount: 1 }, lastUsedAt: new Date() });
          botResult = { text: 'Secret key verified! Connecting you to an admin immediately. Please continue chatting.', fallback: false };
        } else {
          botResult = shouldEscalate
            ? { text: 'I am connecting you to a Support Specialist now. Please wait while an agent joins the chat.', fallback: false }
            : await generateBotResponse(messageText, historyMessages, botName);
        }

        if (!shouldEscalate && botResult?.fallback) {
          showSupportOption = true;
        }

        const botMessage = await Message.create({ chat: chat._id, sender: 'bot', message: botResult.text, seen: false });
        botReply = botMessage;
      } else {
        const botMessage = await Message.create({
          chat: chat._id,
          sender: 'bot',
          message: 'The AI assistant is currently offline. Please request a Support Specialist instead.',
          seen: false,
        });
        botReply = botMessage;
        showSupportOption = true;
      }
    }
  }

  if (sender === 'admin') {
    const joinedById = (chat.joinedBy as any)?._id
      ? (chat.joinedBy as any)._id.toString()
      : chat.joinedBy?.toString();

    if (!chat.escalated) {
      return NextResponse.json({ error: 'You can only reply to escalated chats after joining them.' }, { status: 403 });
    }

    if (!chat.autoJoined && (!joinedById || joinedById !== session.user.id)) {
      return NextResponse.json({ error: 'You must join this chat before sending messages.' }, { status: 403 });
    }

    const existingAdminMessage = await Message.exists({ chat: chat._id, sender: 'admin' });
    if (!existingAdminMessage && chat.escalated) {
      const customer = chat.user as { _id?: string; email?: string; name?: string };
      const notificationMessage = 'A support agent joined your chat and will respond shortly.';
      await createNotification({
        userId: customer._id?.toString() || undefined,
        type: 'admin-message',
        message: notificationMessage,
        meta: { chatId: chat._id.toString(), adminId: session.user.id, joinedAt: new Date() },
      });
      if (customer.email) {
        await sendEmail(
          customer.email,
          'Support agent joined your chat',
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #111;">Support is now online</h2>
            <p>Hi ${customer.name || 'there'},</p>
            <p>An agent has joined your live chat and will answer your request shortly. Open the support chat in your account to continue the conversation.</p>
            <p>Thank you for reaching out.</p>
            <p style="font-size: 12px; color: #666;">Support Team</p>
          </div>`,
          `Hi ${customer.name || 'there'}, an agent has joined your live chat and will answer shortly.`,
        );
      }
    }
  }

  await chat.save();
  const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });
  return NextResponse.json({ chat, messages, botReply, escalationRequested, showSupportOption }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
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

  const chatUserId = (chat.user as any)?._id ? (chat.user as any)._id.toString() : chat.user.toString();
  if (session.user.role === 'customer' && chatUserId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const markSeen = request.nextUrl.searchParams.get('markSeen') === 'true';
  if (!markSeen) {
    return NextResponse.json({ error: 'Invalid patch action' }, { status: 400 });
  }

  const markSender = session.user.role === 'customer' ? 'admin' : 'user';
  await Message.updateMany({ chat: chat._id, sender: markSender, seen: false }, { $set: { seen: true } });

  return NextResponse.json({ success: true }, { status: 200 });
}
