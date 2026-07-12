import { Telegraf } from 'telegraf';
import { resolveTelegramConfig } from './helpers';

let cachedBot: Telegraf | null = null;

export function getTelegramBotClient() {
  if (cachedBot) {
    return cachedBot;
  }

  const config = resolveTelegramConfig();
  const token = config.botToken;

  if (!token) {
    console.warn('Telegram bot disabled: no bot token is configured.');
    throw new Error('Telegram bot token is not configured. Set TELEGRAM_BOT_TOKEN/BOT_TOKEN or save telegramBotToken in business settings.');
  }

  console.log('Telegram bot initialized for admin IDs:', config.adminChatIds);
  cachedBot = new Telegraf(token);
  try {
    const useWebhookSecret = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET);
    const isProd = process.env.NODE_ENV === 'production';
    // Only enable long polling when explicitly allowed via TELEGRAM_ENABLE_POLLING
    // This prevents accidental getUpdates conflicts when another instance or webhook is active.
    const enablePollingEnv = String(process.env.TELEGRAM_ENABLE_POLLING || '').toLowerCase();
    const envAllowsPolling = enablePollingEnv === '1' || enablePollingEnv === 'true' || enablePollingEnv === 'yes';
    const shouldPoll = envAllowsPolling && !useWebhookSecret && !isProd;
    if (shouldPoll) {
      console.log('Launching Telegram bot polling from client (development mode)');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      cachedBot.launch({ polling: true } as any).catch((e) => console.warn('Telegram polling launch failed', e));
    } else {
      console.log('Telegram polling disabled (set TELEGRAM_ENABLE_POLLING=true to enable in dev)');
    }
  } catch (e) {
    console.warn('Telegram client polling setup failed', e);
  }
  return cachedBot;
}

export function getTelegramApiClient() {
  return getTelegramBotClient().telegram;
}
