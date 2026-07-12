import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTelegramReportText, resolveTelegramConfig } from '../telegramBot/helpers';

test('resolveTelegramConfig prefers environment variables over saved admin settings', () => {
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

  assert.equal(result.botToken, 'env-token');
  assert.deepEqual(result.adminChatIds, ['100', '200']);
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

test('resolveTelegramConfig uses env vars even when saved settings disable Telegram', () => {
  const result = resolveTelegramConfig({
    env: {
      TELEGRAM_BOT_TOKEN: 'telegram-token',
      TELEGRAM_ADMIN_IDS: '300',
    },
    settings: {
      telegramEnabled: false,
      telegramBotToken: 'saved-token',
      telegramAdminIds: '1',
    },
  });

  assert.equal(result.botToken, 'telegram-token');
  assert.deepEqual(result.adminChatIds, ['300']);
  assert.equal(result.enabled, true);
});

test('buildTelegramReportText includes the requested summary sections', () => {
  const text = buildTelegramReportText({
    title: 'Today\'s Report',
    totals: {
      totalOrders: 4,
      completedOrders: 2,
      pendingOrders: 1,
      processingOrders: 1,
      shippedOrders: 0,
      deliveredOrders: 2,
      rejectedOrders: 0,
      refundedOrders: 0,
      paidOrders: 3,
      unpaidOrders: 1,
    },
    revenue: 1234.5,
    newCustomers: 2,
    inventory: {
      lowStockProducts: 1,
      outOfStockProducts: 0,
      bestSellingProducts: ['Keyboard'],
      worstSellingProducts: ['Mouse'],
    },
  });

  assert.match(text, /Today's Report/);
  assert.match(text, /\*Total Orders:\* 4/);
  assert.match(text, /\*Revenue:\* ₹1234.50/);
  assert.match(text, /\*Low Stock Products:\* 1/);
  assert.match(text, /\*Best Selling Products:\* Keyboard/);
});
