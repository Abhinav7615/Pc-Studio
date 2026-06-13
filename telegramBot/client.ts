import { Telegraf } from 'telegraf';

let cachedBot: Telegraf | null = null;

export function getTelegramBotClient() {
  if (cachedBot) {
    return cachedBot;
  }

  const token = process.env.BOT_TOKEN;

  if (!token) {
    throw new Error('BOT_TOKEN is not configured. Set BOT_TOKEN in environment variables.');
  }

  cachedBot = new Telegraf(token);
  return cachedBot;
}

export function getTelegramApiClient() {
  return getTelegramBotClient().telegram;
}
