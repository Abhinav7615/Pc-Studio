import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTelegramConfig } from '../telegramBot/helpers';

test('resolveTelegramConfig prefers saved admin settings over environment variables', () => {
  const result = resolveTelegramConfig({
    env: {
      BOT_TOKEN: 'env-token',
      ADMIN_TELEGRAM_IDS: '100,200',
    },
    settings: {
      telegramBotToken: 'saved-token',
      telegramAdminIds: '1,2',
    },
  });

  assert.equal(result.botToken, 'saved-token');
  assert.deepEqual(result.adminChatIds, ['1', '2']);
});

test('resolveTelegramConfig falls back to environment variables when no saved settings exist', () => {
  const result = resolveTelegramConfig({
    env: {
      BOT_TOKEN: 'env-token',
      ADMIN_TELEGRAM_IDS: '100, 200',
    },
  });

  assert.equal(result.botToken, 'env-token');
  assert.deepEqual(result.adminChatIds, ['100', '200']);
});
