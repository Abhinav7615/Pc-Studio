import dbConnect from '@/lib/mongodb';
import TelegramSession from '@/models/TelegramSession';

export interface TelegramSessionRecord {
  telegramId: number;
  chatId: number;
  state: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export async function loadTelegramSession(telegramId: number) {
  await dbConnect();
  return TelegramSession.findOne({ telegramId }).lean<TelegramSessionRecord | null>();
}

export async function saveTelegramSession(
  telegramId: number,
  chatId: number,
  state: string,
  payload: Record<string, unknown> = {},
) {
  await dbConnect();
  return TelegramSession.findOneAndUpdate(
    { telegramId },
    { chatId, state, payload, updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<TelegramSessionRecord>();
}

export async function clearTelegramSession(telegramId: number) {
  await dbConnect();
  return TelegramSession.deleteOne({ telegramId });
}
