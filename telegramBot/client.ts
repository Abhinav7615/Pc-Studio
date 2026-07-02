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
    throw new Error('Telegram bot token is not configured. Set BOT_TOKEN or save telegramBotToken in business settings.');
  }

  cachedBot = new Telegraf(token);
  return cachedBot;
}

export function getTelegramApiClient() {
  return getTelegramBotClient().telegram;
}
