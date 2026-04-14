import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET() {
  await dbConnect();
  const settings = await BusinessSettings.findOne();
  return NextResponse.json({
    chatEnabled: settings?.chatEnabled ?? true,
    chatBotEnabled: settings?.chatBotEnabled ?? true,
    chatBotName: settings?.chatBotName ?? 'ShopBot',
    chatBotIntroMessage: settings?.chatBotIntroMessage ?? '',
    chatJoinMessage: settings?.chatJoinMessage ?? 'An agent has joined your chat and will respond shortly.',
    chatEndMessage: settings?.chatEndMessage ?? 'Thank you for chatting with us. If you need anything else, we are here to help!',
    paymentVerificationStartTime: settings?.paymentVerificationStartTime ?? '09:00',
    paymentVerificationEndTime: settings?.paymentVerificationEndTime ?? '17:00',
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (
    typeof body.chatEnabled !== 'boolean' &&
    typeof body.chatBotEnabled !== 'boolean' &&
    typeof body.chatBotName !== 'string' &&
    typeof body.chatBotIntroMessage !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
  }

  await dbConnect();
  let settings = await BusinessSettings.findOne();
  if (!settings) {
    settings = new BusinessSettings();
  }

  if (typeof body.chatEnabled === 'boolean') {
    settings.chatEnabled = body.chatEnabled;
  }
  if (typeof body.chatBotEnabled === 'boolean') {
    settings.chatBotEnabled = body.chatBotEnabled;
  }
  if (typeof body.chatBotName === 'string') {
    settings.chatBotName = body.chatBotName.trim() || 'ShopBot';
  }
  if (typeof body.chatBotIntroMessage === 'string') {
    settings.chatBotIntroMessage = body.chatBotIntroMessage;
  } else if (body.chatBotIntroMessage !== undefined) {
    settings.chatBotIntroMessage = String(body.chatBotIntroMessage || '');
  }

  await settings.save();

  return NextResponse.json({
    chatEnabled: settings.chatEnabled,
    chatBotEnabled: settings.chatBotEnabled,
    chatBotName: settings.chatBotName,
    chatBotIntroMessage: settings.chatBotIntroMessage || '',
  }, { status: 200 });
}
