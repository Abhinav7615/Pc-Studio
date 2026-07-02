import { Markup } from 'telegraf';
import type { Context } from 'telegraf';
import { loadTelegramSession, saveTelegramSession, clearTelegramSession } from './session';
import {
  buildMainMenuKeyboard,
  buildOrderActionsKeyboard,
  buildOrderStatusSelectionKeyboard,
  formatCurrency,
  formatOrderDetails,
  formatOrderSummary,
  formatProductSummary,
  getOrderListByStatus,
  getTelegramStats,
  isAuthorizedTelegramId,
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
import Product from '@/models/Product';
import { createNotificationAndPush } from '@/lib/notifications';
import dbConnect from '@/lib/mongodb';

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

function parseTelegramActionPayload(data?: string) {
  if (!data) return null;
  const cleaned = data.trim();
  if (!cleaned) return null;

  const parts = cleaned.split(':').filter(Boolean);
  if (parts.length < 3) return null;

  const [namespace, action, targetId, ...extra] = parts;
  if (!['order', 'payment', 'product'].includes(namespace) || !action || !targetId) {
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

  if (!targetId || !action) {
    return ctx.answerCbQuery('Invalid action.');
  }

  if (namespace === 'order') {
    const order = await findOrderByIdOrNumber(targetId);
    if (!order) {
      return ctx.answerCbQuery('Order not found');
    }

    switch (action) {
      case 'accept':
        order.status = 'Order Preparing';
        await order.save();
        await notifyAdminsOrderUpdate(order, 'Accepted order');
        await ctx.editMessageText(`Order ${order.orderNumber} marked as *Order Preparing*.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order accepted');
      case 'reject':
        order.status = 'Order Rejected';
        await order.save();
        await notifyAdminsOrderUpdate(order, 'Rejected order');
        await ctx.editMessageText(`Order ${order.orderNumber} rejected.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order rejected');
      case 'mark_processing':
        order.status = 'Order Preparing';
        await order.save();
        await notifyAdminsOrderUpdate(order, 'Marked processing');
        await ctx.editMessageText(`Order ${order.orderNumber} marked as processing.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order processing');
      case 'mark_shipped':
        order.status = 'Shipped';
        await order.save();
        await notifyAdminsOrderUpdate(order, 'Marked shipped');
        await ctx.editMessageText(`Order ${order.orderNumber} marked shipped.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order shipped');
      case 'mark_delivered':
        order.status = 'Delivered';
        await order.save();
        await notifyAdminsOrderUpdate(order, 'Marked delivered');
        await ctx.editMessageText(`Order ${order.orderNumber} marked delivered.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order delivered');
      case 'mark_paid':
        order.status = 'Payment Verified';
        order.paymentVerifiedAt = new Date();
        await order.save();
        await notifyAdminsOrderUpdate(order, 'Marked paid');
        await ctx.editMessageText(`Order ${order.orderNumber} marked paid.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order paid');
      case 'mark_unpaid':
        order.status = 'Payment Pending';
        await order.save();
        await notifyAdminsOrderUpdate(order, 'Marked unpaid');
        await ctx.editMessageText(`Order ${order.orderNumber} marked unpaid.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Order unpaid');
      case 'refund':
        order.refundStatus = 'Refund Pending';
        await order.save();
        await notifyAdminsOrderUpdate(order, 'Refund requested');
        await ctx.editMessageText(`Order ${order.orderNumber} set to refund pending.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Refund requested');
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
        await order.save();
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
      case 'approve':
        order.status = 'Payment Verified';
        order.paymentVerifiedAt = new Date();
        await order.save();
        await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Payment approved for order ${order.orderNumber}.`, meta: { orderId: order._id.toString() } });
        await notifyAdminsOrderUpdate(order, 'Payment approved');
        await ctx.editMessageText(`Payment approved for order ${order.orderNumber}.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Payment approved');
      case 'reject':
        order.status = 'Payment Rejected';
        await order.save();
        await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Payment proof rejected for order ${order.orderNumber}. Please upload a new screenshot.`, meta: { orderId: order._id.toString() } });
        await notifyAdminsOrderUpdate(order, 'Payment rejected');
        await ctx.editMessageText(`Payment rejected for order ${order.orderNumber}.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Payment rejected');
      case 'request_screenshot':
        order.status = 'Payment Pending';
        await order.save();
        await createNotificationAndPush({ userId: String(order.customer?._id ?? order.customer), type: 'order-status', message: `Please upload a new payment screenshot for order ${order.orderNumber}.`, meta: { orderId: order._id.toString() } });
        await notifyAdminsOrderUpdate(order, 'Requested new payment screenshot');
        await ctx.editMessageText(`Requested new screenshot for order ${order.orderNumber}.`, { parse_mode: 'Markdown' });
        return ctx.answerCbQuery('Requested screenshot');
      default:
        return ctx.answerCbQuery('Unknown payment action');
    }
  }

  if (namespace === 'product') {
    const product = await Product.findById(targetId);
    if (!product) {
      return ctx.answerCbQuery('Product not found');
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

  async function setSession(ctx: TelegramContext, state: string, payload: TelegramSessionPayload = {}) {
    const telegramId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (!telegramId || !chatId) return;
    const session = await saveTelegramSession(telegramId, chatId, state, payload);
    ctx.sessionData = session;
  }

  async function clearSession(ctx: TelegramContext) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    await clearTelegramSession(telegramId);
    ctx.sessionData = { telegramId, chatId: ctx.chat?.id ?? 0, state: 'idle', payload: {} };
  }

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
    await ctx.reply(caption, { parse_mode: 'Markdown', reply_markup: buildOrderActionsKeyboard(order._id.toString()).reply_markup });
  });

  bot.command('stats', async (ctx: TelegramContext) => {
    const stats = await getTelegramStats();
    await ctx.reply(
      ['*Dashboard Analytics*',
        `*Total Revenue:* ${formatCurrency(stats.totalRevenue)}`,
        `*Today's Revenue:* ${formatCurrency(stats.todayRevenue)}`,
        `*Total Orders:* ${stats.totalOrders}`,
        `*Pending Orders:* ${stats.pendingOrders}`,
        `*Processing Orders:* ${stats.processingOrders}`,
        `*Shipped Orders:* ${stats.shippedOrders}`,
        `*Delivered Orders:* ${stats.deliveredOrders}`,
        `*Rejected Orders:* ${stats.rejectedOrders}`,
        `*Refunded Orders:* ${stats.refundedOrders}`,
        `*Total Products:* ${stats.totalProducts}`,
        `*Low Stock Products:* ${stats.lowStockProducts}`,
        `*Total Users:* ${stats.totalUsers}`].join('\n'),
      { parse_mode: 'Markdown' },
    );
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
    const payload = parseTelegramActionPayload(callbackData);
    if (!payload) {
      return;
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
