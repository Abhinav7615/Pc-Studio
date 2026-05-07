import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';
import Message from '@/models/Message';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/sendEmail';

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { chatId } = await params;
  await dbConnect();

  const chat = await Chat.findById(chatId)
    .populate('participants', 'name email mobile customerId')
    .populate('targetUser', 'name email mobile customerId')
    .populate('user', 'name email mobile customerId');

  if (!chat) {
    return NextResponse.json({ error: 'Consumer chat not found' }, { status: 404 });
  }

  const isParticipant = (chat.participants as any[]).some((participant) => participant._id.toString() === session.user.id);
  if (!isParticipant && session.user.role !== 'admin' && session.user.role !== 'staff') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ chat }, { status: 200 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { chatId } = await params;
  await dbConnect();

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'consumer') {
      return NextResponse.json({ error: 'Consumer chat not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';

    const currentUserId = session.user.id;
    const isParticipant = (chat.participants as any[]).some((id) => id.toString() === currentUserId);
    if (!isParticipant && session.user.role !== 'admin' && session.user.role !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'accept') {
      if (chat.status !== 'pending') {
        return NextResponse.json({ error: 'Chat is not pending' }, { status: 400 });
      }
      if (chat.targetUser?.toString() !== currentUserId) {
        return NextResponse.json({ error: 'Only the invited customer can accept this chat request' }, { status: 401 });
      }

      chat.status = 'active';
      chat.acceptedAt = new Date();
      chat.acceptedBy = currentUserId;
      chat.lastMessageAt = new Date();
      await chat.save();

      const acceptedUser = await User.findById(currentUserId);
      const requester = await User.findById(chat.user);

      if (acceptedUser && requester) {
        await Message.create({
          chat: chat._id,
          sender: 'user',
          senderId: acceptedUser._id,
          senderName: acceptedUser.name || 'Customer',
          message: 'I have accepted the chat request. You can now continue the conversation.',
          seen: false,
        });

        await createNotification({
          userId: requester._id.toString(),
          type: 'user-action',
          message: `${acceptedUser.name || 'A customer'} accepted your chat request.`,
          meta: { chatId: chat._id.toString(), acceptedBy: acceptedUser._id.toString() },
        });

        const requesterEmail = requester.email || process.env.EMAIL_USER;
        if (requesterEmail) {
          try {
            await sendEmail(
              requesterEmail,
              'Your chat request has been accepted',
              `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                 <h2 style="color: #111;">Chat request accepted</h2>
                 <p>Hi ${requester.name || 'there'},</p>
                 <p>${acceptedUser.name || 'Another customer'} has accepted your chat request. You can now continue the conversation in your account.</p>
               </div>`,
              `${acceptedUser.name || 'Another customer'} accepted your chat request.`
            );
          } catch (emailError) {
            console.error('[consumer-chat accept PUT] Email send failed:', emailError);
          }
        }
      }

      const updatedChat = await Chat.findById(chat._id)
        .populate('participants', 'name email mobile customerId')
        .populate('targetUser', 'name email mobile customerId')
        .populate('user', 'name email mobile customerId');

      return NextResponse.json({ chat: updatedChat }, { status: 200 });
    }

    if (action === 'close') {
      chat.status = 'closed';
      chat.lastMessageAt = new Date();
      await chat.save();
      const updatedChat = await Chat.findById(chat._id)
        .populate('participants', 'name email mobile customerId')
        .populate('targetUser', 'name email mobile customerId')
        .populate('user', 'name email mobile customerId');
      return NextResponse.json({ chat: updatedChat }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[consumer-chat accept PUT] Unexpected error:', error);
    return NextResponse.json({ error: 'Unable to process chat update. Please try again.' }, { status: 500 });
  }
}
