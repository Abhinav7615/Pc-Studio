import { Markup } from 'telegraf';
import type { Context } from 'telegraf';
import { loadTelegramSession, saveTelegramSession, clearTelegramSession } from './session';
import {
  buildInventoryActionsKeyboard,
  buildMainMenuKeyboard,
  buildOrderActionsKeyboard,
  buildOrderManagementKeyboard,
  buildOrderStatusSelectionKeyboard,
  buildReportSelectionKeyboard,
  buildTrackingActionsKeyboard,
  formatCurrency,
  formatOrderDetails,
  formatOrderSummary,
  formatProductSummary,
  getOrderListByStatus,
  getTelegramDashboardReport,
  getTelegramStats,
  isAuthorizedTelegramId,
  notifyAdminsInventoryUpdate,
  notifyAdminsNewOrder,
  notifyAdminsOrderUpdate,
  notifyAdminsPaymentProof,
  searchOrdersByQuery,
  searchProductsByQuery,
  searchUsersByQuery,
  findOrderByIdOrNumber,
  normalizeUrl,
  broadcastToAllUsers,
} from './helpers';
import { getTelegramBotClient } from './client';
import Product from '../models/Product';
import { createNotificationAndPush } from '../lib/notifications';
import dbConnect from '../lib/mongodb';

type TelegramSessionPayload = Record<string, unknown>;

type TelegramSessionData = {
  telegramId: number;
  chatId: number;
  state: string;
  payload: TelegramSessionPayload;
};

interface TelegramContext extends Context {
  sessionData?: TelegramSessionData | null;
}

type TelegramActionContext = TelegramContext & { match?: RegExpMatchArray };

type TelegramWritableOrder = {
  save: () => Promise<unknown>;
  depopulate?: (path?: string) => unknown;
};

function prepareOrderForTelegramSave(order: TelegramWritableOrder) {
  if (order && typeof order.depopulate === 'function') {
    order.depopulate('customer');
    order.depopulate('products.product');
  }
}

async function saveOrderFromTelegram(ctx: TelegramActionContext, order: TelegramWritableOrder, logData: Record<string, unknown>) {
  try {
    prepareOrderForTelegramSave(order);
    await order.save();
    console.log('handleTelegramAction: order saved', logData);
    return true;
  } catch (e) {
    console.error('handleTelegramAction: order.save failed', e);
    await ctx.answerCbQuery('Database update failed. Please check server logs.', { show_alert: true });
    return false;
  }
}

async function setSession(ctx: TelegramContext, state: string, payload: TelegramSessionPayload = {}) {
  const telegramId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!telegramId || !chatId) {
    return;
  }
  const session = await saveTelegramSession(telegramId, chatId, state, payload);
  ctx.sessionData = session;
}

async function clearSession(ctx: TelegramContext) {
  const telegramId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!telegramId) {
    return;
  }
  await clearTelegramSession(telegramId);
  ctx.sessionData = { telegramId, chatId: chatId ?? 0, state: 'idle', payload: {} };
}

function parseTelegramActionPayload(data?: string) {
  if (!data) return null;
  const cleaned = data.trim();
  if (!cleaned) return null;

  const parts = cleaned.split(':').filter(Boolean);
  if (parts.length < 3) return null;

  const [namespace, action, targetId, ...extra] = parts;
  if (!['order', 'payment', 'product', 'premiumcard'].includes(namespace) || !action || !targetId) {
    return null;
  }

  return {
    namespace,
    action,
    targetId,
    extra: extra.map((item) => decodeURIComponent(item)),
  };
}

async function handleTelegramAction(ctx: TelegramActionContext, payload: { namespace: string; action: string; targetId: string; extra: string[] }) {
  const { namespace, action, targetId, extra } = payload;
  const telegramId = ctx.from?.id;
  console.log('handleTelegramAction: invoked', { payload, from: telegramId, chat: ctx.chat?.id });
  if (!telegramId || !(await isAuthorizedTelegramId(telegramId))) {
    return ctx.answerCbQuery('Unauthorized access.', { show_alert: true });
  }

  // Ensure DB connection for any read/write operations performed here
  try {
    await dbConnect();
  } catch (e) {
    console.warn('handleTelegramAction: dbConnect failed', e);
  }

  if (!targetId || !action) {
    return ctx.answerCbQuery('Invalid action.');
  }

  if (namespace === 'order') {
    const order = await findOrderByIdOrNumber(targetId);
    console.log('handleTelegramAction: order lookup result', order ? { id: String(order._id), status: order.status } : null);
    if (!order) {
      return ctx.answerCbQuery('Order not found');
    }

    switch (action) {
      case 'accept':
      case 'verify':
        const shouldVerifyPayment = order.status === 'Payment Pending' || order.status === 'Payment Rejected' || order.status === 'Payment Failed' || order.paymentMethod === 'manual' || order.paymentMethod === 'bank_transfer';
        if (action === 'verify' && shouldVerifyPayment) {
          order.status = 'Payment Verified';
          order.paymentVerifiedAt = new Date();
        } else {
          order.status = 'Order Preparing';
        }
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} verified by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, action === 'accept' ? 'Accepted order' : 'Verified order/payment');
        await ctx.editMessageText(`Order ${order.orderNumber} marked as *${order.status}*.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery(action === 'accept' ? 'Order accepted' : 'Verified');
      case 'reject_payment':
      case 'reject':
        order.status = 'Payment Rejected';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} rejected by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Rejected order/payment');
        await ctx.editMessageText(`Order ${order.orderNumber} rejected.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Rejected');
      case 'reject_order':
        order.status = 'Order Rejected';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} rejected by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Rejected order');
        await ctx.editMessageText(`Order ${order.orderNumber} rejected.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order rejected');
      case 'tracking':
        await ctx.editMessageText('Choose a tracking action:', { reply_markup: buildTrackingActionsKeyboard(order._id.toString()).reply_markup, parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Tracking menu');
      case 'add_tracking':
      case 'edit_tracking':
        await setSession(ctx, 'setTrackingId', { orderId: order._id.toString(), action });
        await ctx.editMessageText(`Send the tracking ID for order ${order.orderNumber}:`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Enter tracking ID');
      case 'remove_tracking':
        order.trackingId = '';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), trackingId: order.trackingId }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Tracking removed for ${order.orderNumber}`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Tracking removed');
        await ctx.editMessageText(`Tracking removed from ${order.orderNumber}.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Tracking removed');
      case 'add_courier':
        await setSession(ctx, 'setCourierName', { orderId: order._id.toString() });
        await ctx.editMessageText(`Send the courier name for order ${order.orderNumber}:`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Enter courier name');
      case 'add_tracking_url':
        await setSession(ctx, 'setTrackingUrl', { orderId: order._id.toString() });
        await ctx.editMessageText(`Send the tracking URL for order ${order.orderNumber}:`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Enter tracking URL');
      case 'message_customer':
        await ctx.editMessageText('Customer messaging is available from the website admin panel.');
        return ctx.answerCbQuery('Customer messaging pending');
      case 'back':
        await ctx.editMessageText(`Order ${order.orderNumber} menu:`, { reply_markup: buildOrderActionsKeyboard(order._id.toString(), order.paymentMethod ?? undefined).reply_markup, parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Back to order menu');
      case 'mark_processing':
        order.status = 'Order Preparing';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} marked processing by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Marked processing');
        await ctx.editMessageText(`Order ${order.orderNumber} marked as processing.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order processing');
      case 'mark_shipped':
        order.status = 'Shipped';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} marked shipped by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Marked shipped');
        await ctx.editMessageText(`Order ${order.orderNumber} marked shipped.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order shipped');
      case 'mark_delivered':
        order.status = 'Delivered';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} marked delivered by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Marked delivered');
        await ctx.editMessageText(`Order ${order.orderNumber} marked delivered.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order delivered');
      case 'mark_paid':
        order.status = 'Payment Verified';
        order.paymentVerifiedAt = new Date();
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status, paymentVerifiedAt: order.paymentVerifiedAt }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Payment marked paid for ${order.orderNumber}`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Marked paid');
        await ctx.editMessageText(`Order ${order.orderNumber} marked paid.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order paid');
      case 'mark_unpaid':
        order.status = 'Payment Pending';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} marked unpaid by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Marked unpaid');
        await ctx.editMessageText(`Order ${order.orderNumber} marked unpaid.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order unpaid');
      case 'refund':
        order.refundStatus = 'Refund Pending';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), refundStatus: order.refundStatus }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Refund requested for ${order.orderNumber}`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Refund requested');
        await ctx.editMessageText(`Order ${order.orderNumber} set to refund pending.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Refund requested');
      case 'hold':
        order.status = 'Payment Processing';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} put on hold by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Put on hold');
        await ctx.editMessageText(`Order ${order.orderNumber} put on hold.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order on hold');
      case 'cancel':
        order.status = 'Order Rejected';
        order.cancellationStatus = 'Cancellation Approved';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status, cancellationStatus: order.cancellationStatus }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} cancelled by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Cancelled order');
        await ctx.editMessageText(`Order ${order.orderNumber} cancelled.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order cancelled');
      case 'view':
        await ctx.editMessageText(formatOrderDetails(order), { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order details shown');
      case 'edit_status':
        await ctx.editMessageText('Choose a new status for this order:', { reply_markup: buildOrderStatusSelectionKeyboard(order._id.toString()).reply_markup, parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Select status');
      case 'set_status': {
        const newStatus = extra[0];
        if (!newStatus) return ctx.answerCbQuery('Status not specified');
        order.status = newStatus as any;
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Order ${order.orderNumber} status changed to ${newStatus} by admin`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, `Status changed to ${newStatus}`);
        await ctx.editMessageText(`Order ${order.orderNumber} status changed to *${newStatus}*.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Status updated');
      }
      case 'delete': {
        if (order.status !== 'Order Rejected' && order.cancellationStatus !== 'Cancellation Approved') {
          return ctx.answerCbQuery('Only rejected or cancelled orders may be deleted.');
        }
        await order.deleteOne();
        await ctx.editMessageText(`Order ${order.orderNumber} deleted successfully.`);
        return ctx.answerCbQuery('Order deleted');
      }
      default:
        return ctx.answerCbQuery('Unknown order action');
    }
  }

  if (namespace === 'payment') {
    const order = await findOrderByIdOrNumber(targetId);
    if (!order) {
      return ctx.answerCbQuery('Order not found');
    }
    switch (action) {
      case 'verify':
      case 'approve':
        order.status = 'Payment Verified';
        order.paymentVerifiedAt = new Date();
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status, paymentVerifiedAt: order.paymentVerifiedAt }))) return;
        await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Payment approved for order ${order.orderNumber}.`, meta: { orderId: order._id.toString() } });
        await notifyAdminsOrderUpdate(order, 'Payment approved');
        await ctx.editMessageText(`Payment approved for order ${order.orderNumber}.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Payment approved');
      case 'reject':
        order.status = 'Payment Rejected';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Payment proof rejected for order ${order.orderNumber}. Please upload a new screenshot.`, meta: { orderId: order._id.toString() } });
        await notifyAdminsOrderUpdate(order, 'Payment rejected');
        await ctx.editMessageText(`Payment rejected for order ${order.orderNumber}.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Payment rejected');
      case 'request_screenshot':
        order.status = 'Payment Pending';
        if (!(await saveOrderFromTelegram(ctx, order, { id: String(order._id), status: order.status }))) return;
        await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Please upload a new payment screenshot for order ${order.orderNumber}.`, meta: { orderId: order._id.toString() } });
        await notifyAdminsOrderUpdate(order, 'Requested new payment screenshot');
        await ctx.editMessageText(`Requested new screenshot for order ${order.orderNumber}.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Requested screenshot');
      default:
        return ctx.answerCbQuery('Unknown payment action');
    }
  }

  if (namespace === 'premiumcard') {
    const CardOrder = (await import('@/models/PremiumCardOrder')).default;
    const cardOrder = await CardOrder.findById(targetId);
    if (!cardOrder) {
      return ctx.answerCbQuery('Card order not found');
    }

    switch (action) {
      case 'approve':
        if (cardOrder.status === 'approved') {
          return ctx.answerCbQuery('Already approved');
        }
        cardOrder.status = 'approved';
        cardOrder.approvedAt = new Date();
        await cardOrder.save();
        await ctx.editMessageText(
          `✅ *Payment verified for order ${cardOrder.orderId}*\n\nNext: Use "📦 Release Card" button to send card details to customer.`,
          { parse_mode: 'Markdown' }
        );
        return ctx.answerCbQuery('Payment approved');

      case 'reject':
        if (cardOrder.status === 'rejected') {
          return ctx.answerCbQuery('Already rejected');
        }
        cardOrder.status = 'rejected';
        cardOrder.rejectedAt = new Date();
        await cardOrder.save();
        await ctx.editMessageText(`❌ *Order ${cardOrder.orderId} rejected*`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order rejected');

      case 'release':
        if (cardOrder.status !== 'approved') {
          return ctx.answerCbQuery('Order must be approved first');
        }
        const telegramId = ctx.from?.id;
        const chatId = ctx.chat?.id;
        if (telegramId && chatId) {
          const session = await saveTelegramSession(telegramId, chatId, 'releasePremiumCard', {
            cardOrderId: targetId,
            cardOrderNumber: cardOrder.orderId,
          });
          ctx.sessionData = session;
        }
        await ctx.editMessageText(
          '📝 *Enter Card Details*\n\nPlease send the card number (e.g., 1234567890123456):',
          { parse_mode: 'Markdown' }
        );
        return ctx.answerCbQuery('Ready to enter card details');

      default:
        return ctx.answerCbQuery('Unknown premium card action');
    }
  }

  if (namespace === 'product') {
    const product = await Product.findById(targetId);
    if (!product) {
      return ctx.answerCbQuery('Product not found');
    }
    if (action === 'increase_stock') {
      product.quantity = (Number(product.quantity) || 0) + 1;
      await product.save();
      await notifyAdminsInventoryUpdate(product, (Number(product.quantity) || 0) - 1);
      await ctx.editMessageText(`Stock increased for *${product.name}* to ${product.quantity}.`, { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('Stock increased');
    }
    if (action === 'decrease_stock') {
      product.quantity = Math.max(0, (Number(product.quantity) || 0) - 1);
      await product.save();
      await notifyAdminsInventoryUpdate(product, (Number(product.quantity) || 0) + 1);
      await ctx.editMessageText(`Stock decreased for *${product.name}* to ${product.quantity}.`, { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('Stock decreased');
    }
    if (action === 'edit_quantity') {
      product.quantity = Number(extra[0]) || 0;
      await product.save();
      await notifyAdminsInventoryUpdate(product, Number(extra[0]) || 0);
      await ctx.editMessageText(`Stock updated for *${product.name}* to ${product.quantity}.`, { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('Stock updated');
    }
    if (action === 'enable') {
      product.status = 'active';
      await product.save();
      await ctx.editMessageText(`Product *${product.name}* enabled.`, { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('Product enabled');
    }
    if (action === 'disable') {
      product.status = 'archived';
      await product.save();
      await ctx.editMessageText(`Product *${product.name}* disabled.`, { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('Product disabled');
    }
    if (action === 'view_inventory') {
      await ctx.editMessageText(formatProductSummary(product), { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('Inventory shown');
    }
    if (action === 'delete') {
      await product.deleteOne();
      await ctx.editMessageText(`Product ${product.name} deleted.`);
      return ctx.answerCbQuery('Product deleted');
    }
    if (action === 'edit') {
      const telegramId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      if (telegramId && chatId) {
        const session = await saveTelegramSession(telegramId, chatId, 'editProductDetails', { productId: product._id.toString() });
        ctx.sessionData = session;
      }
      await ctx.editMessageText(`Editing product *${product.name}*. Send the field name you want to update (name, description, price, discount, stock, status, categories, tags):`, { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('Edit product');
    }
  }

  return ctx.answerCbQuery('Unknown action');
}

function getBot() {
  const bot = getTelegramBotClient();

  // If webhook is not configured and we're in local/dev, enable polling so callbacks are handled locally.
  try {
    const useWebhookSecret = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET);
    const isProd = process.env.NODE_ENV === 'production';
    const shouldPoll = !useWebhookSecret && !isProd;
    if (shouldPoll) {
      // start polling once
      // Telegraf's launch will internally ignore multiple launches; guard with a console flag
      console.log('Starting Telegram bot polling (development mode) to receive callback queries locally');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (bot as any).launch({ polling: true }).catch((e: unknown) => console.warn('Telegram polling launch failed', e));
    }
  } catch (e) {
    console.warn('Telegram polling setup check failed', e);
  }

  bot.use(async (ctx: TelegramContext, next: () => Promise<void>) => {
    const telegramId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (!telegramId || !chatId) {
      return;
    }

    const authorized = await isAuthorizedTelegramId(telegramId);
    if (!authorized) {
      const replyText = 'Unauthorized access. Your Telegram ID is not authorized to use this bot.';
      if (ctx.updateType === 'callback_query') {
        await ctx.answerCbQuery(replyText, { show_alert: true });
      } else {
        await ctx.reply(replyText);
      }
      return;
    }

    const session = await loadTelegramSession(telegramId);
    ctx.sessionData = session || { telegramId, chatId, state: 'idle', payload: {} };
    await next();
  });


  const mainMenuText = 'Telegram Admin Dashboard is ready. Choose a section or use a command:';

  bot.start(async (ctx: TelegramContext) => {
    await setSession(ctx, 'idle');
    await ctx.reply(mainMenuText, { reply_markup: buildMainMenuKeyboard().reply_markup });
  });

  bot.help(async (ctx: TelegramContext) => {
    await ctx.reply(
      'Available commands:\n' +
        '/orders - list recent orders\n' +
        '/order <ORDER_ID> - view a single order\n' +
        '/pending /processing /shipped /delivered /rejected /refunded - filter orders\n' +
        '/stats - show dashboard analytics\n' +
        '/addproduct /editproduct /deleteproduct /listproducts - product management\n' +
        '/searchproduct /searchuser /searchorder - search database\n' +
        '/broadcast - broadcast an admin message to all users\n' +
        '/cancel - cancel the current operation',
      { reply_markup: buildMainMenuKeyboard().reply_markup },
    );
  });

  bot.command('orders', async (ctx: TelegramContext) => {
    const orders = await getOrderListByStatus('all');
    if (!orders.length) return ctx.reply('No orders found.');
    const text = orders.slice(0, 10).map((order) => formatOrderSummary(order)).join('\n\n');
    await ctx.reply(text, { parse_mode: 'Markdown' });
  });

  bot.command('pending', async (ctx: TelegramContext) => {
    const orders = await getOrderListByStatus('pending');
    if (!orders.length) return ctx.reply('No pending orders found.');
    await ctx.reply(orders.map((order) => formatOrderSummary(order)).join('\n\n'), { parse_mode: 'Markdown' });
  });

  bot.command('processing', async (ctx: TelegramContext) => {
    const orders = await getOrderListByStatus('processing');
    if (!orders.length) return ctx.reply('No processing orders found.');
    await ctx.reply(orders.map((order) => formatOrderSummary(order)).join('\n\n'), { parse_mode: 'Markdown' });
  });

  bot.command('shipped', async (ctx: TelegramContext) => {
    const orders = await getOrderListByStatus('shipped');
    if (!orders.length) return ctx.reply('No shipped orders found.');
    await ctx.reply(orders.map((order) => formatOrderSummary(order)).join('\n\n'), { parse_mode: 'Markdown' });
  });

  bot.command('delivered', async (ctx: TelegramContext) => {
    const orders = await getOrderListByStatus('delivered');
    if (!orders.length) return ctx.reply('No delivered orders found.');
    await ctx.reply(orders.map((order) => formatOrderSummary(order)).join('\n\n'), { parse_mode: 'Markdown' });
  });

  bot.command('rejected', async (ctx: TelegramContext) => {
    const orders = await getOrderListByStatus('rejected');
    if (!orders.length) return ctx.reply('No rejected orders found.');
    await ctx.reply(orders.map((order) => formatOrderSummary(order)).join('\n\n'), { parse_mode: 'Markdown' });
  });

  bot.command('refunded', async (ctx: TelegramContext) => {
    const orders = await getOrderListByStatus('refunded');
    if (!orders.length) return ctx.reply('No refunded orders found.');
    await ctx.reply(orders.map((order) => formatOrderSummary(order)).join('\n\n'), { parse_mode: 'Markdown' });
  });

  bot.command('order', async (ctx: TelegramContext) => {
    const query = ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ').slice(1).join(' ').trim() : '';
    if (!query) {
      return ctx.reply('Please provide an order ID or order number. Example: /order 123456');
    }

    const order = await findOrderByIdOrNumber(query);
    if (!order) {
      return ctx.reply('Order not found.');
    }

    const caption = formatOrderDetails(order);
    await ctx.reply(caption, { parse_mode: 'Markdown', reply_markup: buildOrderManagementKeyboard(order._id.toString(), order.paymentMethod ?? undefined).reply_markup });
  });

  bot.command('stats', async (ctx: TelegramContext) => {
    const report = await getTelegramDashboardReport();
    await ctx.reply(report.today, { parse_mode: 'Markdown', reply_markup: buildReportSelectionKeyboard().reply_markup });
  });

  bot.command('reports', async (ctx: TelegramContext) => {
    await ctx.reply('Choose a report to view:', { reply_markup: buildReportSelectionKeyboard().reply_markup });
  });

  bot.command('listproducts', async (ctx: TelegramContext) => {
    await dbConnect();
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(25);
    if (!products.length) {
      return ctx.reply('No products found.');
    }
    await ctx.reply(products.map((product) => formatProductSummary(product)).join('\n\n'), { parse_mode: 'Markdown' });
  });

  bot.command('searchproduct', async (ctx: TelegramContext) => {
    await setSession(ctx, 'searchProduct');
    return ctx.reply('Enter a product name, ID, category, or tag to search:');
  });

  bot.command('searchuser', async (ctx: TelegramContext) => {
    await setSession(ctx, 'searchUser');
    return ctx.reply('Enter a user name, email, mobile, or ID to search:');
  });

  bot.command('searchorder', async (ctx: TelegramContext) => {
    await setSession(ctx, 'searchOrder');
    return ctx.reply('Enter an order number, ID, or status keyword to search:');
  });

  bot.command('addproduct', async (ctx: TelegramContext) => {
    await setSession(ctx, 'addProduct');
    return ctx.reply('Enter the product name:');
  });

  bot.command('editproduct', async (ctx: TelegramContext) => {
    await setSession(ctx, 'editProductSearch');
    return ctx.reply('Enter product name or ID to edit:');
  });

  bot.command('deleteproduct', async (ctx: TelegramContext) => {
    await setSession(ctx, 'deleteProductSearch');
    return ctx.reply('Enter product name or ID to delete:');
  });

  bot.command('broadcast', async (ctx: TelegramContext) => {
    await setSession(ctx, 'broadcastMessage');
    return ctx.reply('Enter the broadcast message text that should be sent to all registered users:');
  });

  bot.command('cancel', async (ctx: TelegramContext) => {
    await clearSession(ctx);
    return ctx.reply('Current operation canceled.', { reply_markup: buildMainMenuKeyboard().reply_markup });
  });

  bot.hears('📦 Orders', async (ctx: TelegramContext) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.telegram.sendMessage(chatId, 'Use /orders or one of the status commands to review orders.', { reply_markup: buildMainMenuKeyboard().reply_markup });
  });
  bot.hears('💳 Payments', async (ctx: TelegramContext) => { await ctx.reply('Use /orders to review orders and payment proofs. You can also open an order with /order <id>.', { reply_markup: buildMainMenuKeyboard().reply_markup }); });
  bot.hears('🛍 Products', async (ctx: TelegramContext) => { await ctx.reply('Use /listproducts, /addproduct, /editproduct, or /deleteproduct.', { reply_markup: buildMainMenuKeyboard().reply_markup }); });
  bot.hears('👥 Users', async (ctx: TelegramContext) => { await ctx.reply('Use /searchuser to find customers.', { reply_markup: buildMainMenuKeyboard().reply_markup }); });
  bot.hears('📊 Statistics', async (ctx: TelegramContext) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.telegram.sendMessage(chatId, 'Fetching dashboard analytics...', { reply_markup: buildMainMenuKeyboard().reply_markup });
    await bot.telegram.sendMessage(chatId, 'Please run /stats for current analytics.');
  });
  bot.hears('📢 Broadcast', async (ctx: TelegramContext) => { await ctx.reply('Use /broadcast to send a message to all registered users.'); });
  bot.hears('⚙ Settings', async (ctx: TelegramContext) => { await ctx.reply('Settings are managed in the website admin panel. Use /help for available Telegram commands.'); });

  bot.on('text', async (ctx: TelegramContext) => {
    const session = ctx.sessionData;
    const text = ctx.message && 'text' in ctx.message ? (ctx.message.text ?? '').trim() : '';
    if (!session || session.state === 'idle') {
      return ctx.reply('Use /help or the keyboard menu to start a task.', { reply_markup: buildMainMenuKeyboard().reply_markup });
    }

    if (session.state === 'editProductDetails' || session.state === 'editProductValue') {
      const payload = session.payload as Record<string, unknown>;
      if (!payload.productId) {
        await clearSession(ctx);
        return ctx.reply('Session expired or invalid. Please restart with /editproduct.');
      }
      const product = await Product.findById(payload.productId);
      if (!product) {
        await clearSession(ctx);
        return ctx.reply('Product not found. Please restart with /editproduct.');
      }

      if (session.state === 'editProductDetails') {
        const field = text.toLowerCase();
        const availableFields = ['name', 'description', 'price', 'discount', 'stock', 'status', 'categories', 'tags'];
        if (!availableFields.includes(field)) {
          return ctx.reply(`Unknown field. Choose one of: ${availableFields.join(', ')}`);
        }
        payload.field = field;
        await setSession(ctx, 'editProductValue', payload);
        return ctx.reply(`Enter the new value for ${field}:`);
      }

      if (session.state === 'editProductValue') {
        const field = payload.field as string;
        const update: Record<string, unknown> = {};
        switch (field) {
          case 'name':
          case 'description':
            update[field] = text;
            break;
          case 'price':
            update.originalPrice = Number(text);
            if (Number.isNaN(update.originalPrice)) return ctx.reply('Please enter a valid price.');
            break;
          case 'discount':
            update.discountPercent = Number(text);
            if (Number.isNaN(update.discountPercent)) return ctx.reply('Please enter a valid discount percent.');
            break;
          case 'stock':
            update.quantity = Number(text);
            if (Number.isNaN(update.quantity)) return ctx.reply('Please enter a valid stock quantity.');
            break;
          case 'status':
            update.status = ['active', 'out-of-stock', 'new', 'archived'].includes(text.toLowerCase()) ? text.toLowerCase() : product.status;
            break;
          case 'categories':
            update.categories = text.split(',').map((item: string) => item.trim()).filter(Boolean) || ['all'];
            break;
          case 'tags':
            update.tags = text.split(',').map((item: string) => item.trim()).filter(Boolean);
            break;
          default:
            break;
        }
        Object.assign(product, update);
        await product.save();
        await clearSession(ctx);
        return ctx.reply(`Product updated successfully.\n${formatProductSummary(product)}`, { parse_mode: 'Markdown' });
      }
    }

    switch (session.state) {
      case 'searchProduct': {
        const results = await searchProductsByQuery(text);
        if (!results.length) {
          return ctx.reply('No matching products found. Please try another query or /cancel.');
        }
        const reply = results.map((product) => formatProductSummary(product)).join('\n\n');
        await clearSession(ctx);
        return ctx.reply(reply, { parse_mode: 'Markdown' });
      }
      case 'searchUser': {
        const results = await searchUsersByQuery(text);
        if (!results.length) {
          return ctx.reply('No matching users found. Please try another query or /cancel.');
        }
        const reply = results.map((user) => `*${user.name}*\nID: ${user._id}\nEmail: ${user.email || 'N/A'}\nMobile: ${user.mobile}`).join('\n\n');
        await clearSession(ctx);
        return ctx.reply(reply, { parse_mode: 'Markdown' });
      }
      case 'searchOrder': {
        const results = await searchOrdersByQuery(text);
        if (!results.length) {
          return ctx.reply('No matching orders found. Please try another query or /cancel.');
        }
        const reply = results.map((order) => formatOrderSummary(order)).join('\n\n');
        await clearSession(ctx);
        return ctx.reply(reply, { parse_mode: 'Markdown' });
      }
      case 'setTrackingId': {
        const payload = session.payload as Record<string, unknown>;
        const orderId = String(payload.orderId || '');
        const order = await findOrderByIdOrNumber(orderId);
        if (!order) {
          await clearSession(ctx);
          return ctx.reply('Order not found. Please start again with the order menu.');
        }
        order.trackingId = text;
        try {
          prepareOrderForTelegramSave(order);
          await order.save();
          console.log('handleTelegramText: tracking id saved', { id: String(order._id), trackingId: order.trackingId });
        } catch (e) {
          console.error('handleTelegramText: tracking id save failed', e);
          await clearSession(ctx);
          return ctx.reply('Failed to save tracking ID. Please try again.');
        }
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Tracking ID updated for ${order.orderNumber}`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Tracking number updated');
        await clearSession(ctx);
        await ctx.reply(`Tracking ID saved for order ${order.orderNumber}.`, { reply_markup: buildOrderActionsKeyboard(order._id.toString(), order.paymentMethod ?? undefined).reply_markup, parse_mode: 'Markdown' });
        return;
      }
      case 'setCourierName': {
        const payload = session.payload as Record<string, unknown>;
        const orderId = String(payload.orderId || '');
        const order = await findOrderByIdOrNumber(orderId);
        if (!order) {
          await clearSession(ctx);
          return ctx.reply('Order not found. Please start again with the order menu.');
        }
        order.deliveryCompanyName = text;
        try {
          prepareOrderForTelegramSave(order);
          await order.save();
          console.log('handleTelegramText: courier name saved', { id: String(order._id), deliveryCompanyName: order.deliveryCompanyName });
        } catch (e) {
          console.error('handleTelegramText: courier name save failed', e);
          await clearSession(ctx);
          return ctx.reply('Failed to save courier name. Please try again.');
        }
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Courier name updated for ${order.orderNumber}`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Courier updated');
        await clearSession(ctx);
        await ctx.reply(`Courier name saved for order ${order.orderNumber}.`, { reply_markup: buildOrderActionsKeyboard(order._id.toString(), order.paymentMethod ?? undefined).reply_markup, parse_mode: 'Markdown' });
        return;
      }
      case 'setTrackingUrl': {
        const payload = session.payload as Record<string, unknown>;
        const orderId = String(payload.orderId || '');
        const order = await findOrderByIdOrNumber(orderId);
        if (!order) {
          await clearSession(ctx);
          return ctx.reply('Order not found. Please start again with the order menu.');
        }
        (order as any).trackingUrl = text;
        try {
          prepareOrderForTelegramSave(order);
          await order.save();
          console.log('handleTelegramText: tracking url saved', { id: String(order._id), trackingUrl: (order as any).trackingUrl });
        } catch (e) {
          console.error('handleTelegramText: tracking url save failed', e);
          await clearSession(ctx);
          return ctx.reply('Failed to save tracking URL. Please try again.');
        }
        try { await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Tracking URL updated for ${order.orderNumber}`, meta: { orderId: order._id.toString() } }); } catch (e) { console.warn('notify createNotificationAndPush failed', e); }
        await notifyAdminsOrderUpdate(order, 'Tracking URL updated');
        await clearSession(ctx);
        await ctx.reply(`Tracking URL saved for order ${order.orderNumber}.`, { reply_markup: buildOrderActionsKeyboard(order._id.toString(), order.paymentMethod ?? undefined).reply_markup, parse_mode: 'Markdown' });
        return;
      }
      case 'releasePremiumCard': {
        const payload = session.payload as Record<string, unknown>;
        const cardOrderId = String(payload.cardOrderId || '');
        const CardOrder = (await import('@/models/PremiumCardOrder')).default;
        const cardOrder = await CardOrder.findById(cardOrderId);
        if (!cardOrder) {
          await clearSession(ctx);
          return ctx.reply('Card order not found. Please start again.');
        }

        // Multi-step process: collect cardNumber, expiry, cvv, holderName
        if (!payload.cardNumber) {
          payload.cardNumber = text;
          await setSession(ctx, 'releasePremiumCard', payload);
          return ctx.reply('✓ Card number saved.\n\nEnter expiry date (MM/YY):');
        }
        if (!payload.expiry) {
          payload.expiry = text;
          await setSession(ctx, 'releasePremiumCard', payload);
          return ctx.reply('✓ Expiry date saved.\n\nEnter CVV:');
        }
        if (!payload.cvv) {
          payload.cvv = text;
          await setSession(ctx, 'releasePremiumCard', payload);
          return ctx.reply('✓ CVV saved.\n\nEnter cardholder name:');
        }
        if (!payload.holderName) {
          payload.holderName = text;
          
          // All details collected - now update the order
          try {
            const cardDetails = {
              cardNumber: String(payload.cardNumber),
              expiry: String(payload.expiry),
              cvv: String(payload.cvv),
              holderName: String(payload.holderName),
            };

            // Update via API to ensure consistency
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/premium-cards/orders/${cardOrderId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'released',
                cardDetails,
              }),
            });

            if (!response.ok) {
              await clearSession(ctx);
              return ctx.reply('Failed to release card. Please check the order and try again.');
            }

            await clearSession(ctx);
            await ctx.reply(
              `✅ *Card Released Successfully*\n\nOrder: ${cardOrder.orderId}\nCustomer: ${cardOrder.userName}\n\nCard details have been sent to the customer.`,
              { parse_mode: 'Markdown' }
            );
            return;
          } catch (e) {
            console.error('releasePremiumCard failed', e);
            await clearSession(ctx);
            return ctx.reply('Error releasing card. Please try again.');
          }
        }
        return;
      }
      case 'broadcastMessage': {
        await clearSession(ctx);
        const broadcastStats = await broadcastToAllUsers(text);
        await ctx.reply(`Broadcast created for ${broadcastStats.totalUsers} users and notifications were created for ${broadcastStats.notificationsCreated} entries. Push attempts sent to ${broadcastStats.pushSent} users.`);
        return;
      }
      case 'addProduct': {
        const payload = session.payload as Record<string, unknown>;
        if (!payload.name) {
          payload.name = text;
          await setSession(ctx, 'addProductDescription', payload);
          return ctx.reply('Enter the product description:');
        }
        if (!payload.description) {
          payload.description = text;
          await setSession(ctx, 'addProductCategory', payload);
          return ctx.reply('Enter categories separated by commas (or "all"):');
        }
        if (!payload.categories) {
          payload.categories = text.split(',').map((item: string) => item.trim()).filter(Boolean) || ['all'];
          await setSession(ctx, 'addProductPrice', payload);
          return ctx.reply('Enter the original price (numbers only):');
        }
        if (payload.originalPrice === undefined) {
          const value = Number(text);
          if (Number.isNaN(value) || value < 0) {
            return ctx.reply('Please enter a valid numeric original price.');
          }
          payload.originalPrice = value;
          await setSession(ctx, 'addProductDiscount', payload);
          return ctx.reply('Enter discount percent (0 if none):');
        }
        if (payload.discountPercent === undefined) {
          const value = Number(text);
          if (Number.isNaN(value) || value < 0) {
            return ctx.reply('Please enter a valid discount percent.');
          }
          payload.discountPercent = value;
          await setSession(ctx, 'addProductStock', payload);
          return ctx.reply('Enter stock quantity:');
        }
        if (payload.quantity === undefined) {
          const value = Number(text);
          if (Number.isNaN(value) || value < 0) {
            return ctx.reply('Please enter a valid stock quantity.');
          }
          payload.quantity = value;
          await setSession(ctx, 'addProductTags', payload);
          return ctx.reply('Enter comma separated tags (optional):');
        }
        if (!payload.tags) {
          payload.tags = text.split(',').map((item: string) => item.trim()).filter(Boolean);
          await setSession(ctx, 'addProductImage', payload);
          return ctx.reply('Send a product image as a photo or paste an image URL:');
        }
        if (!payload.imageUrl) {
          payload.imageUrl = text;
          await setSession(ctx, 'addProductStatus', payload);
          return ctx.reply('Enter product status: active, out-of-stock, new, or archived:');
        }
        if (!payload.status) {
          const status = ['active', 'out-of-stock', 'new', 'archived'].includes(text.toLowerCase()) ? text.toLowerCase() : 'active';
          payload.status = status;
          const product = new Product({
            name: payload.name,
            description: payload.description,
            originalPrice: payload.originalPrice,
            discountPercent: payload.discountPercent,
            gstPercent: payload.gstPercent ?? 0,
            quantity: payload.quantity,
            images: [normalizeUrl(String(payload.imageUrl))].filter(Boolean),
            categories: payload.categories,
            status: payload.status,
            tags: payload.tags,
          });
          await product.save();
          await clearSession(ctx);
          await ctx.reply(`Product created successfully: ${product._id}`);
          return;
        }
        break;
      }
      case 'editProductSearch': {
        const products = await searchProductsByQuery(text);
        if (!products.length) {
          return ctx.reply('No products found for this query.');
        }
        const buttons = products.slice(0, 5).map((product) => Markup.button.callback(product.name, `product:edit:${product._id}`));
        await setSession(ctx, 'idle');
        return ctx.reply('Choose a product to edit:', Markup.inlineKeyboard(buttons));
      }
      case 'deleteProductSearch': {
        const products = await searchProductsByQuery(text);
        if (!products.length) {
          return ctx.reply('No products found for this query.');
        }
        const buttons = products.slice(0, 5).map((product) => Markup.button.callback(product.name, `product:delete:${product._id}`));
        await setSession(ctx, 'idle');
        return ctx.reply('Choose a product to delete:', Markup.inlineKeyboard(buttons));
      }
      default:
        await ctx.reply('Command not recognized in the current flow. Use /cancel to exit or /help to list commands.');
        return;
    }
  });

  bot.on('photo', async (ctx: TelegramContext) => {
    const session = ctx.sessionData;
    if (!session || !session.state.startsWith('addProduct')) {
      return;
    }
    const photos = ctx.message && 'photo' in ctx.message ? ctx.message.photo : [];
    const photo = photos[photos.length - 1];
    if (!photo) {
      return ctx.reply('Could not detect the photo. Please send the product image again.');
    }
    const link = await ctx.telegram.getFileLink(photo.file_id);
    const payload = session.payload as Record<string, unknown>;
    payload.imageUrl = link.href;
    await setSession(ctx, 'addProductStatus', payload);
    return ctx.reply('Product image received. Enter product status: active, out-of-stock, new, or archived:');
  });

  bot.on('callback_query', async (ctx: TelegramContext) => {
    const callbackData = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
    if (!callbackData) {
      return;
    }

    if (callbackData.startsWith('report:')) {
      const report = await getTelegramDashboardReport();
      if (callbackData === 'report:today') {
        await ctx.answerCbQuery('Today\'s report');
        return ctx.editMessageText(report.today, { parse_mode: 'Markdown' });
      }
      if (callbackData === 'report:monthly') {
        await ctx.answerCbQuery('Monthly report');
        return ctx.editMessageText(report.monthly, { parse_mode: 'Markdown' });
      }
      if (callbackData === 'report:inventory') {
        await ctx.answerCbQuery('Inventory report');
        return ctx.editMessageText(report.inventory, { parse_mode: 'Markdown' });
      }
    }

    const payload = parseTelegramActionPayload(callbackData);
    if (!payload) {
      return ctx.answerCbQuery('Unsupported action');
    }

    await handleTelegramAction(ctx as TelegramActionContext, payload);
  });

  return bot;
}

export function getTelegramBot() {
  return getBot();
}

import { OrderDocument } from './helpers';

export async function handleNewOrderNotification(order: OrderDocument) {
  await notifyAdminsNewOrder(order);
}

export async function handlePaymentProofNotification(order: OrderDocument) {
  await notifyAdminsPaymentProof(order);
}

export async function handleOrderUpdateNotification(order: OrderDocument, action: string) {
  await notifyAdminsOrderUpdate(order, action);
}
