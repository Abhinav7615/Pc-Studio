import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import CallSession from '@/models/CallSession';

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;
  await dbConnect();

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  const isParticipant = (chat.participants as any[]).some((participant) => participant.toString() === session.user.id);
  if (!isParticipant && session.user.role !== 'admin' && session.user.role !== 'staff') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const callSession = await CallSession.findOne({ chatId }).lean();
  return NextResponse.json({ session: callSession || null }, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;
  await dbConnect();

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  const isParticipant = (chat.participants as any[]).some((participant) => participant.toString() === session.user.id);
  if (!isParticipant && session.user.role !== 'admin' && session.user.role !== 'staff') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === 'string' ? body.action : '';
  const role = ['admin', 'user', 'initiator', 'responder', 'offer', 'answer'].includes(body.role)
    ? body.role
    : null;
  const sdp = body.sdp ?? null;
  const candidate = body.candidate ?? null;

  try {
    let callSession = await CallSession.findOne({ chatId });
    if (action === 'offer') {
      if (!sdp) {
        return NextResponse.json({ error: 'Offer SDP is required' }, { status: 400 });
      }
      if (!callSession) {
        callSession = new CallSession({
          chatId,
          initiatorId: session.user.id,
          receiverId: null,
          roomId: `call-${chatId}`,
          offer: sdp,
          answer: null,
          offerCandidates: [],
          answerCandidates: [],
          status: 'ringing',
        });
      } else {
        callSession.offer = sdp;
        callSession.status = 'ringing';
        callSession.offerCandidates = [];
        callSession.answer = null;
        callSession.answerCandidates = [];
      }
      await callSession.save();
      return NextResponse.json({ session: callSession.toObject() }, { status: 200 });
    }

    if (action === 'answer') {
      if (!sdp) {
        return NextResponse.json({ error: 'Answer SDP is required' }, { status: 400 });
      }
      if (!callSession) {
        return NextResponse.json({ error: 'Call session not found' }, { status: 404 });
      }
      callSession.receiverId = session.user.id;
      callSession.answer = sdp;
      callSession.status = 'active';
      await callSession.save();
      return NextResponse.json({ session: callSession.toObject() }, { status: 200 });
    }

    if (action === 'candidate') {
      if (!candidate) {
        return NextResponse.json({ error: 'ICE candidate is required' }, { status: 400 });
      }
      if (!callSession) {
        return NextResponse.json({ error: 'Call session not found' }, { status: 404 });
      }
      if (role === 'admin' || role === 'answer') {
        callSession.answerCandidates = [...(callSession.answerCandidates || []), candidate];
      } else {
        callSession.offerCandidates = [...(callSession.offerCandidates || []), candidate];
      }
      await callSession.save();
      return NextResponse.json({ session: callSession.toObject() }, { status: 200 });
    }

    if (action === 'end') {
      if (!callSession) {
        return NextResponse.json({ error: 'Call session not found' }, { status: 404 });
      }
      callSession.status = 'ended';
      await callSession.save();
      return NextResponse.json({ session: callSession.toObject() }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Call session error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
