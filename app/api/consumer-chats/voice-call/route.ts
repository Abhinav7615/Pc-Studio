import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import ConsumerChat from '@/models/Chat';

interface VoiceCall {
  _id?: string;
  chatId: string;
  initiatorId: string;
  receiverId: string;
  initiatorName: string;
  receiverName: string;
  status: 'initiated' | 'ringing' | 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  callToken?: string; // For WebRTC or call service
}

const activeCalls = new Map<string, VoiceCall>();

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { chatId, action } = await req.json();

    if (!chatId) {
      return Response.json({ error: 'chatId required' }, { status: 400 });
    }

    const chat = await ConsumerChat.findById(chatId).populate('participants');

    if (!chat) {
      return Response.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.status !== 'active') {
      return Response.json({ error: 'Chat is not active' }, { status: 400 });
    }

    const initiator = chat.participants.find((p: any) => p._id.toString() === session.user.id);
    const receiver = chat.participants.find((p: any) => p._id.toString() !== session.user.id);

    if (!initiator || !receiver) {
      return Response.json({ error: 'Invalid participants' }, { status: 400 });
    }

    if (action === 'initiate') {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const voiceCall: VoiceCall = {
        _id: callId,
        chatId,
        initiatorId: initiator._id.toString(),
        receiverId: receiver._id.toString(),
        initiatorName: initiator.name || 'Unknown',
        receiverName: receiver.name || 'Unknown',
        status: 'initiated',
        startedAt: new Date(),
        callToken: `token_${Math.random().toString(36).substr(2, 20)}`,
      };

      activeCalls.set(callId, voiceCall);

      // Auto-remove call after 30 seconds if not answered
      setTimeout(() => {
        if (activeCalls.get(callId)?.status === 'initiated') {
          activeCalls.delete(callId);
        }
      }, 30000);

      return Response.json({
        success: true,
        call: voiceCall,
      });
    } else if (action === 'answer') {
      const { callId } = await req.json();
      const call = activeCalls.get(callId);

      if (!call) {
        return Response.json({ error: 'Call not found' }, { status: 404 });
      }

      call.status = 'active';
      activeCalls.set(callId, call);

      return Response.json({
        success: true,
        call,
      });
    } else if (action === 'end') {
      const { callId } = await req.json();
      const call = activeCalls.get(callId);

      if (call) {
        call.status = 'ended';
        call.endedAt = new Date();
        call.duration = Math.floor(
          (call.endedAt.getTime() - call.startedAt.getTime()) / 1000
        );
        activeCalls.set(callId, call);

        // Remove from active calls after 5 seconds
        setTimeout(() => {
          activeCalls.delete(callId);
        }, 5000);
      }

      return Response.json({
        success: true,
        call,
      });
    } else if (action === 'get') {
      const { callId } = await req.json();
      const call = activeCalls.get(callId);

      return Response.json({
        call: call || null,
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Error in voice call:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
