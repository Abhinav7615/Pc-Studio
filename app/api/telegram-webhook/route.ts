import { NextRequest, NextResponse } from 'next/server';
import { getTelegramBot } from '@/telegramBot/bot';

export async function POST(request: NextRequest) {
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretToken) {
    const incomingToken = request.headers.get('x-telegram-bot-api-secret-token');
    if (!incomingToken || incomingToken !== secretToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const update = await request.json();

  try {
    const bot = getTelegramBot();
    await bot.handleUpdate(update, undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook handling failed:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint available' }, { status: 200 });
}
