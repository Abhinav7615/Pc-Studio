import dbConnect from '../lib/mongodb';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Notification from '../models/Notification';
import Device from '../models/Device';
import { createNotificationAndPush } from '../lib/notifications';
import BusinessSettings from '../models/BusinessSettings';
import { getTelegramApiClient } from './client';
import { getGridFSBucket } from '../lib/mediaGridFS';
import { Markup } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';

export type InlineKeyboardMarkup = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
};
import mongoose from 'mongoose';

export type OrderProductItem = {
  product: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string } | null;
  productName?: string;
  quantity: number;
  price: number;
  gstPercent?: number;
  discountPercent?: number;
};

export type OrderDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  customer?: { _id: mongoose.Types.ObjectId; name?: string | null; email?: string | null; mobile?: string | null } | string | null;
  orderNumber?: string | null;
  products?: OrderProductItem[] | null;
  total?: number | null;
  status?: string | null;
  paymentMethod?: string | null;
  paymentScreenshot?: string | null;
  shipping?: {
    name?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    mobile?: string | null;
  } | null;
  transactionId?: string | null;
  refundStatus?: string | null;
  returnStatus?: string | null;
  cancellationStatus?: string | null;
  cancellationReason?: string | null;
  modificationRequest?: { status?: string | null; reason?: string | null } | null;
  deliveryCompanyName?: string | null;
  trackingId?: string | null;
  createdAt?: Date | string | null;
  paymentVerifiedAt?: Date | string | null;
  paymentFailureReason?: string | null;
};

export type ProductDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  name?: string;
  originalPrice?: number;
  discountPercent?: number;
  gstPercent?: number;
  quantity?: number;
  status?: string;
  categories?: string[];
  tags?: string[];
  images?: string[];
};

export type UserDocument = mongoose.Document & {
  name?: string;
  email?: string;
  mobile?: string;
  customerId?: string;
};

export type TelegramConfig = {
  botToken: string;
  adminChatIds: string[];
  enabled: boolean;
};

export type TelegramReportSummary = {
  title: string;
  totals: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    rejectedOrders: number;
    refundedOrders: number;
    paidOrders: number;
    unpaidOrders: number;
  };
  revenue: number;
  newCustomers: number;
  inventory: {
    lowStockProducts: number;
    outOfStockProducts: number;
    bestSellingProducts: string[];
    worstSellingProducts: string[];
  };
};

export async function getBusinessTelegramSettings() {
  try {
    const settings = await BusinessSettings.findOne({}).lean();
    return {
      telegramEnabled: Boolean(settings?.telegramEnabled),
      telegramBotToken: typeof settings?.telegramBotToken === 'string' ? settings.telegramBotToken.trim() : '',
      telegramAdminIds: typeof settings?.telegramAdminIds === 'string' ? settings.telegramAdminIds : '',
    };
  } catch (error) {
    console.warn('Unable to load Telegram settings from business settings:', error);
    return { telegramEnabled: false, telegramBotToken: '', telegramAdminIds: '' };
  }
}

export function resolveTelegramConfig(options?: { env?: Record<string, string | undefined>; settings?: { telegramBotToken?: string; telegramAdminIds?: string; telegramEnabled?: boolean } }) {
  const env = options?.env ?? process.env;
  const settingsToken = options?.settings?.telegramBotToken?.trim() || '';
  const settingsIds = options?.settings?.telegramAdminIds?.trim() || '';
  const envToken = (env.TELEGRAM_BOT_TOKEN || env.BOT_TOKEN || '').trim();
  const envIds = (env.TELEGRAM_ADMIN_IDS || env.ADMIN_TELEGRAM_IDS || env.TELEGRAM_CHAT_ID || '').trim();

  const configuredToken = envToken || settingsToken;
  const configuredIds = envIds || settingsIds;
  const hasEnvConfig = Boolean(envToken || envIds);
  const hasSettingsConfig = Boolean(settingsToken || settingsIds);
  const enabled = hasEnvConfig
    ? Boolean(configuredToken.trim()) && Boolean(configuredIds)
    : Boolean(options?.settings?.telegramEnabled) || hasSettingsConfig;

  const adminChatIds = configuredIds
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter(Boolean);

  const resolved = {
    botToken: configuredToken.trim(),
    adminChatIds,
    enabled: enabled && Boolean(configuredToken.trim()) && adminChatIds.length > 0,
  } satisfies TelegramConfig;

  if (process.env.NODE_ENV !== 'test') {
    console.log('[Telegram config]', {
      hasToken: Boolean(resolved.botToken),
      adminChatIds: resolved.adminChatIds,
      enabled: resolved.enabled,
      source: envToken ? 'env' : 'settings',
    });
  }

  return resolved;
}

export async function getAuthorizedTelegramIds(): Promise<string[]> {
  const settings = await getBusinessTelegramSettings();
  const config = resolveTelegramConfig({
    env: process.env,
    settings: {
      telegramBotToken: settings.telegramBotToken,
      telegramAdminIds: settings.telegramAdminIds,
      telegramEnabled: settings.telegramEnabled,
    },
  });

  if (!config.adminChatIds.length) {
    console.warn('Telegram notifications disabled: no admin Telegram IDs are configured.');
  } else {
    console.log('Telegram recipients resolved:', config.adminChatIds);
  }

  return config.adminChatIds;
}

export async function isAuthorizedTelegramId(telegramId: number | string) {
  const allowed = await getAuthorizedTelegramIds();
  return allowed.includes(String(telegramId));
}

export function buildMainMenuKeyboard() {
  return Markup.keyboard([
    ['📦 Orders', '💳 Payments'],
    ['🛍 Products', '👥 Users'],
    ['📊 Statistics', '📢 Broadcast'],
    ['⚙ Settings'],
  ]).resize();
}

export function buildOrderActionsKeyboard(orderId: string, _paymentMethod?: string): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons: Array<ReturnType<typeof Markup.button.callback>[]> = [
    [Markup.button.callback('✅ Verify', `order:verify:${orderId}`), Markup.button.callback('❌ Reject', `order:reject:${orderId}`)],
    [Markup.button.callback('📦 Tracking', `order:tracking:${orderId}`), Markup.button.callback('🔍 View Details', `order:view:${orderId}`)],
  ];
  return Markup.inlineKeyboard(buttons);
}

export function buildPaymentActionsKeyboard(orderId: string, _paymentMethod?: string): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons: Array<ReturnType<typeof Markup.button.callback>[]> = [
    [Markup.button.callback('✅ Verify', `payment:verify:${orderId}`), Markup.button.callback('❌ Reject', `payment:reject:${orderId}`)],
    [Markup.button.callback('🔍 View Details', `order:view:${orderId}`)],
  ];
  return Markup.inlineKeyboard(buttons);
}

export function buildPremiumCardActionsKeyboard(cardOrderId: string): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons: Array<ReturnType<typeof Markup.button.callback>[]> = [
    [Markup.button.callback('✅ Approve', `premiumcard:approve:${cardOrderId}`), Markup.button.callback('❌ Reject', `premiumcard:reject:${cardOrderId}`)],
    [Markup.button.callback('📦 Release Card', `premiumcard:release:${cardOrderId}`)],
  ];
  return Markup.inlineKeyboard(buttons);
}

export function buildTrackingActionsKeyboard(orderId: string): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Add/Edit Tracking', `order:edit_tracking:${orderId}`), Markup.button.callback('🚚 Courier Name', `order:add_courier:${orderId}`)],
    [Markup.button.callback('🔗 Tracking URL', `order:add_tracking_url:${orderId}`), Markup.button.callback('🗑️ Remove Tracking', `order:remove_tracking:${orderId}`)],
    [Markup.button.callback('⬅️ Back', `order:back:${orderId}`)],
  ]);
}

export function buildOrderStatusSelectionKeyboard(orderId: string): ReturnType<typeof Markup.inlineKeyboard> {
  const statuses = [
    'Payment Pending',
    'Payment Completed',
    'Payment Processing',
    'Payment Verified',
    'Payment Rejected',
    'Payment Failed',
    'Order Preparing',
    'Shipped',
    'Delivered',
    'Order Rejected',
  ];
  const buttons = statuses.map((status) => Markup.button.callback(status, `order:set_status:${orderId}:${encodeURIComponent(status)}`));
  const chunks: Array<ReturnType<typeof Markup.button.callback>[]> = [];
  for (let i = 0; i < buttons.length; i += 2) {
    chunks.push(buttons.slice(i, i + 2));
  }
  return Markup.inlineKeyboard(chunks);
}

export function buildOrderManagementKeyboard(orderId: string, paymentMethod?: string): ReturnType<typeof Markup.inlineKeyboard> {
  const rows: Array<Array<ReturnType<typeof Markup.button.callback>>> = [
    [Markup.button.callback('✅ Accept Order', `order:accept:${orderId}`), Markup.button.callback('❌ Reject Order', `order:reject_order:${orderId}`)],
    [Markup.button.callback('💳 Mark Paid', `order:mark_paid:${orderId}`), Markup.button.callback('⏳ Mark Processing', `order:mark_processing:${orderId}`)],
    [Markup.button.callback('🚚 Mark Shipped', `order:mark_shipped:${orderId}`), Markup.button.callback('✅ Mark Delivered', `order:mark_delivered:${orderId}`)],
    [Markup.button.callback('🔄 Mark Unpaid', `order:mark_unpaid:${orderId}`), Markup.button.callback('↩️ Refund', `order:refund:${orderId}`)],
    [Markup.button.callback('⏸️ Hold', `order:hold:${orderId}`), Markup.button.callback('🛑 Cancel', `order:cancel:${orderId}`)],
    [Markup.button.callback('✏️ Edit Status', `order:edit_status:${orderId}`), Markup.button.callback('💬 Message Customer', `order:message_customer:${orderId}`)],
    [Markup.button.callback('📦 Add Tracking', `order:add_tracking:${orderId}`), Markup.button.callback('📝 Edit Tracking', `order:edit_tracking:${orderId}`)],
    [Markup.button.callback('🗑️ Remove Tracking', `order:remove_tracking:${orderId}`), Markup.button.callback('🚚 Courier Name', `order:add_courier:${orderId}`)],
    [Markup.button.callback('🔗 Tracking URL', `order:add_tracking_url:${orderId}`), Markup.button.callback('🔍 View Details', `order:view:${orderId}`)],
  ];

  if (!paymentMethod || paymentMethod === 'manual' || paymentMethod === 'bank_transfer') {
    rows.splice(1, 0, [Markup.button.callback('✅ Approve Payment', `payment:approve:${orderId}`), Markup.button.callback('❌ Reject Payment', `payment:reject:${orderId}`)]);
  }

  return Markup.inlineKeyboard(rows);
}

export function buildInventoryActionsKeyboard(productId: string): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Increase Stock', `product:increase_stock:${productId}`), Markup.button.callback('➖ Decrease Stock', `product:decrease_stock:${productId}`)],
    [Markup.button.callback('✏️ Edit Quantity', `product:edit_quantity:${productId}`), Markup.button.callback('🔓 Enable Product', `product:enable:${productId}`)],
    [Markup.button.callback('🔒 Disable Product', `product:disable:${productId}`), Markup.button.callback('📦 View Inventory', `product:view_inventory:${productId}`)],
  ]);
}

export function buildReportSelectionKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📅 Today', 'report:today'), Markup.button.callback('📆 Monthly', 'report:monthly')],
    [Markup.button.callback('📦 Inventory', 'report:inventory')],
  ]);
}

export function normalizeUrl(value?: string) {
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return `${baseUrl.replace(/\/$/, '')}${value.startsWith('/') ? value : `/${value}`}`;
}

export function formatCurrency(amount: number | undefined | null) {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return '₹0.00';
  }
  return `₹${Number(amount).toFixed(2)}`;
}

export function formatOrderSummary(order: OrderDocument) {
  const customer = (order.customer || {}) as { name?: string; email?: string; mobile?: string };
  const items = (order.products || [])
    .map((item) => `- ${item.productName} x${item.quantity} @ ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}`)
    .join('\n');
  return [
    `*Order:* ${order.orderNumber || order._id}`,
    `*Status:* ${order.status}`,
    `*Payment:* ${order.paymentMethod || 'manual'}`,
    order.paymentScreenshot ? `*Payment Screenshot:* ${normalizeUrl(String(order.paymentScreenshot))}` : null,
    `*Customer:* ${customer.name || 'Unknown'}`,
    `*Email:* ${customer.email || 'N/A'}`,
    `*Mobile:* ${customer.mobile || 'N/A'}`,
    `*Total:* ${formatCurrency(order.total)}`,
    `*Transaction ID:* ${order.transactionId || 'N/A'}`,
    `*Refund Status:* ${order.refundStatus || 'No Refund'}`,
    `*Return Status:* ${order.returnStatus || 'No Return'}`,
    `*Cancellation:* ${order.cancellationStatus || 'None'}`,
    `*Items:*\n${items || '- No items found'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatOrderDetails(order: OrderDocument) {
  const shipping = order.shipping || {};
  const details = [
    formatOrderSummary(order),
    `*Shipping Name:* ${shipping.name || 'N/A'}`,
    `*Address:* ${shipping.address || 'N/A'}, ${shipping.city || 'N/A'}, ${shipping.state || 'N/A'}, ${shipping.postalCode || 'N/A'}, ${shipping.country || 'N/A'}`,
    `*Payment Verified At:* ${order.paymentVerifiedAt ? new Date(order.paymentVerifiedAt).toLocaleString() : 'N/A'}`,
    `*Payment Failure Reason:* ${order.paymentFailureReason || 'N/A'}`,
    `*Additional Notes:* ${order.modificationRequest?.reason || order.cancellationReason || 'N/A'}`,
    `*Delivery Company:* ${order.deliveryCompanyName || 'N/A'}`,
    `*Tracking ID:* ${order.trackingId || 'N/A'}`,
  ];
  return details.join('\n');
}

export function formatProductSummary(product: ProductDocument) {
  return [
    `*Product:* ${product.name}`,
    `*ID:* ${product._id}`,
    `*Price:* ${formatCurrency(product.originalPrice)}`,
    `*Discount:* ${product.discountPercent ?? 0}%`,
    `*GST:* ${product.gstPercent ?? 0}%`,
    `*Stock:* ${product.quantity ?? 0}`,
    `*Status:* ${product.status || 'active'}`,
    `*Categories:* ${(product.categories || []).join(', ') || 'all'}`,
    `*Tags:* ${(product.tags || []).join(', ') || 'None'}`,
    `*Images:* ${(product.images || []).length} image(s)`,
  ].join('\n');
}

export async function findOrderByIdOrNumber(query: string) {
  await dbConnect();
  const trimmed = query.trim();
  let order = null;
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    order = await Order.findById(trimmed).populate('customer', 'name email mobile').populate('products.product');
  }
  if (!order) {
    order = await Order.findOne({ orderNumber: trimmed }).populate('customer', 'name email mobile').populate('products.product');
  }
  return order;
}

export async function searchOrdersByQuery(search: string) {
  await dbConnect();
  const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return Order.find({
    $or: [
      { orderNumber: regex },
      { status: regex },
      { paymentMethod: regex },
      { transactionId: regex },
    ],
  })
    .populate('customer', 'name email mobile')
    .sort({ createdAt: -1 })
    .limit(20);
}

export async function searchProductsByQuery(search: string) {
  await dbConnect();
  const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const conditions: Array<Record<string, unknown>> = [
    { name: regex },
    { description: regex },
    { categories: regex },
    { status: regex },
    { tags: regex },
  ];
  if (mongoose.Types.ObjectId.isValid(search.trim())) {
    conditions.push({ _id: search.trim() });
  }
  return Product.find({ $or: conditions }).sort({ createdAt: -1 }).limit(20);
}

export async function searchUsersByQuery(search: string) {
  await dbConnect();
  const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const conditions: Array<Record<string, unknown>> = [
    { name: regex },
    { email: regex },
    { mobile: regex },
    { customerId: regex },
  ];
  if (mongoose.Types.ObjectId.isValid(search.trim())) {
    conditions.push({ _id: search.trim() });
  }
  return User.find({ $or: conditions }).sort({ createdAt: -1 }).limit(20);
}

export async function getOrderListByStatus(statusGroup: string) {
  await dbConnect();
  const query: Record<string, unknown> = {};
  switch (statusGroup) {
    case 'pending':
      query.status = { $in: ['Payment Pending', 'Payment Processing', 'Order Preparing'] };
      break;
    case 'processing':
      query.status = 'Order Preparing';
      break;
    case 'shipped':
      query.status = 'Shipped';
      break;
    case 'delivered':
      query.status = 'Delivered';
      break;
    case 'rejected':
      query.$or = [{ status: 'Order Rejected' }, { cancellationStatus: 'Cancellation Approved' }];
      break;
    case 'refunded':
      query.refundStatus = { $in: ['Refund Pending', 'Refund Approved', 'Refund Processed'] };
      break;
    default:
      break;
  }
  return Order.find(query).populate('customer', 'name email mobile').populate('products.product').sort({ createdAt: -1 }).limit(25);
}

export async function getTelegramStats() {
  await dbConnect();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const allOrders = await Order.find({}).lean();
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter((o) => ['Payment Pending', 'Payment Processing', 'Order Preparing'].includes(o.status)).length;
  const processingOrders = allOrders.filter((o) => o.status === 'Order Preparing').length;
  const shippedOrders = allOrders.filter((o) => o.status === 'Shipped').length;
  const deliveredOrders = allOrders.filter((o) => o.status === 'Delivered').length;
  const rejectedOrders = allOrders.filter((o) => o.status === 'Order Rejected').length;
  const refundedOrders = allOrders.filter((o) => ['Refund Pending', 'Refund Approved', 'Refund Processed'].includes(o.refundStatus)).length;
  const totalRevenue = allOrders
    .filter((o) => !['Payment Pending', 'Payment Failed', 'Order Rejected'].includes(o.status))
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const todayRevenue = allOrders
    .filter((o) => o.createdAt && o.createdAt >= todayStart && !['Payment Pending', 'Payment Failed', 'Order Rejected'].includes(o.status))
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const totalProducts = await Product.countDocuments();
  const lowStockProducts = await Product.countDocuments({ quantity: { $lte: 5 } });
  const totalUsers = await User.countDocuments();

  return {
    totalRevenue,
    todayRevenue,
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    rejectedOrders,
    refundedOrders,
    totalProducts,
    lowStockProducts,
    totalUsers,
  };
}

export async function broadcastToAllUsers(message: string) {
  await dbConnect();
  const users = await User.find({ blocked: { $ne: true } }, '_id').lean();
  const userIds = users.map((user) => user._id);

  if (userIds.length === 0) {
    return { totalUsers: 0, notificationsCreated: 0, pushSent: 0 };
  }

  const notifications = userIds.map((userId) => ({
    user: userId,
    type: 'admin-message',
    message,
    meta: { broadcast: true },
    createdAt: new Date(),
  }));

  await Notification.insertMany(notifications, { ordered: false });

  const devices = await Device.find({ user: { $in: userIds } }, 'user').lean();
  const uniqueDeviceUsers = Array.from(new Set(devices.map((device) => device.user?.toString()).filter(Boolean)));

  let pushSent = 0;
  for (const userId of uniqueDeviceUsers) {
    try {
      await createNotificationAndPush({ userId: String(userId), type: 'admin-message', message, meta: { broadcast: true } });
      pushSent += 1;
    } catch (error) {
      console.error('Broadcast push failed for user', userId, error);
    }
  }

  return { totalUsers: userIds.length, notificationsCreated: notifications.length, pushSent };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTelegramRetry<T>(operation: () => Promise<T>, label: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await sleep(400 * attempt);
        continue;
      }
    }
  }
  console.error(`${label} failed after retries`, lastError);
  return undefined;
}

export async function publishTelegramMessageToAdmins(text: string, extra?: { parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML'; replyMarkup?: ReturnType<typeof Markup.inlineKeyboard> | InlineKeyboardMarkup; disableWebPagePreview?: boolean }) {
  const chatIds = await getAuthorizedTelegramIds();
  if (chatIds.length === 0) {
    return;
  }

  let telegram;
  try {
    telegram = getTelegramApiClient();
  } catch (error) {
    console.warn('Telegram send skipped because bot is not configured:', error);
    return;
  }

  for (const chatId of chatIds) {
    try {
      const replyMarkup = extra?.replyMarkup ? ((extra.replyMarkup as any).reply_markup ?? extra.replyMarkup) : undefined;
      console.log('Sending Telegram message to admin chat', chatId);
      await withTelegramRetry(() => telegram.sendMessage(chatId, text, {
        parse_mode: extra?.parseMode ?? 'Markdown',
        reply_markup: replyMarkup,
      }), `sendMessage:${chatId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Telegram sendMessage error for admin', chatId, message);
    }
  }
}

export async function publishTelegramPhotoToAdmins(photoUrl: string, caption: string, replyMarkup?: ReturnType<typeof Markup.inlineKeyboard> | InlineKeyboardMarkup) {
  const chatIds = await getAuthorizedTelegramIds();
  if (chatIds.length === 0) {
    return;
  }

  let telegram;
  try {
    telegram = getTelegramApiClient();
  } catch (error) {
    console.warn('Telegram photo send skipped because bot is not configured:', error);
    return;
  }
  for (const chatId of chatIds) {
    try {
      const rm = replyMarkup ? ((replyMarkup as any).reply_markup ?? replyMarkup) : undefined;
      console.log('Sending Telegram photo to admin chat', chatId);
      console.log('publishTelegramPhotoToAdmins: incoming photoUrl=', photoUrl);

      // If photoUrl is an HTTP(S) URL, try sending directly
      if (/^https?:\/\//i.test(photoUrl)) {
        console.log('publishTelegramPhotoToAdmins: detected HTTP URL branch for', photoUrl);
        const sentPhoto = await withTelegramRetry(() => telegram.sendPhoto(chatId, photoUrl, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: rm,
        }), `sendPhoto:${chatId}`);
        if (!sentPhoto) {
          await withTelegramRetry(() => telegram.sendMessage(chatId, `${caption}\n\n*Payment Proof Link:* ${photoUrl}`, {
            parse_mode: 'Markdown',
            reply_markup: rm,
          }), `sendPhotoFallback:${chatId}`);
        }
        continue;
      }

      // Special-case: if the path points to our upload handler (/api/upload?file=FILENAME),
      // stream directly from GridFS so Telegram receives the file (Telegram cannot access localhost URLs).
      try {
        if (photoUrl.startsWith('/api/upload') || photoUrl.includes('/api/upload?file=')) {
          const q = photoUrl.split('?')[1] || '';
          const params = new URLSearchParams(q);
          const fileParam = params.get('file') || params.get('filename') || params.get('fileName') || '';
          const fileName = decodeURIComponent(String(fileParam));
          if (fileName) {
            console.log('publishTelegramPhotoToAdmins: attempting GridFS stream for', fileName);
            try {
              const bucket = await getGridFSBucket({ bucketName: 'uploads' });
              const files = await bucket.find({ $or: [{ filename: fileName }, { 'metadata.originalName': fileName }] }).toArray();
              if (files && files.length > 0) {
                const fileDoc = files[0] as any;
                const downloadStream = bucket.openDownloadStream(fileDoc._id);
                const sentPhoto = await withTelegramRetry(() => telegram.sendPhoto(chatId, { source: downloadStream } as any, {
                  caption,
                  parse_mode: 'Markdown',
                  reply_markup: rm,
                }), `sendPhotoGridFS:${chatId}`);
                if (sentPhoto) {
                  continue;
                }
              }
            } catch (gridErr) {
              console.warn('publishTelegramPhotoToAdmins: GridFS stream failed', gridErr);
            }
          }
        }
      } catch (innerErr) {
        console.warn('publishTelegramPhotoToAdmins: GridFS detection error', innerErr);
      }

      // Non-HTTP path: attempt to resolve a local file under project `public` folder
      const cleaned = photoUrl.replace(/^\/+/, '');
      const publicPath = path.join(process.cwd(), 'public', cleaned);
      const altPublicPath = path.join(process.cwd(), cleaned);
      console.log('publishTelegramPhotoToAdmins: cleaned=', cleaned, 'publicPath=', publicPath, 'altPublicPath=', altPublicPath);
      let streamPath: string | null = null;
      console.log('publishTelegramPhotoToAdmins: public exists?', fs.existsSync(publicPath), 'alt exists?', fs.existsSync(altPublicPath));
      if (fs.existsSync(publicPath)) streamPath = publicPath;
      else if (fs.existsSync(altPublicPath)) streamPath = altPublicPath;

      if (streamPath) {
        console.log('publishTelegramPhotoToAdmins: resolved local file streamPath=', streamPath);
        const stream = fs.createReadStream(streamPath);
        const sentPhoto = await withTelegramRetry(() => telegram.sendPhoto(chatId, { source: stream } as any, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: rm,
        }), `sendPhotoStream:${chatId}`);
        if (!sentPhoto) {
          const link = normalizeUrl(photoUrl) || photoUrl;
          await withTelegramRetry(() => telegram.sendMessage(chatId, `${caption}\n\n*Payment Proof Link:* ${link}`, {
            parse_mode: 'Markdown',
            reply_markup: rm,
          }), `sendPhotoFallback:${chatId}`);
        }
        continue;
      }

      // Final fallback: try to normalize to an absolute URL and send as URL; else send as link text
      const maybeUrl = normalizeUrl(photoUrl) || photoUrl;
      console.log('publishTelegramPhotoToAdmins: final maybeUrl=', maybeUrl);
      const sentPhoto = await withTelegramRetry(() => telegram.sendPhoto(chatId, maybeUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: rm,
      }), `sendPhotoFallbackUrl:${chatId}`);
      if (!sentPhoto) {
        await withTelegramRetry(() => telegram.sendMessage(chatId, `${caption}\n\n*Payment Proof Link:* ${maybeUrl}`, {
          parse_mode: 'Markdown',
          reply_markup: rm,
        }), `sendPhotoFallbackMessage:${chatId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Telegram sendPhoto error for admin', chatId, message);
    }
  }
}

function escapeTelegramText(value?: string | number | null) {
  return String(value ?? 'N/A').replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

function buildOrderTelegramItems(order: OrderDocument) {
  const items = (order.products || [])
    .map((item) => `${item.productName || 'Product'} x${item.quantity}`)
    .join(', ');
  return items || 'No items';
}

export function buildTelegramReportText(report: TelegramReportSummary) {
  const lines = [
    `*${report.title}*`,
    `*Total Orders:* ${report.totals.totalOrders}`,
    `*Completed Orders:* ${report.totals.completedOrders}`,
    `*Pending Orders:* ${report.totals.pendingOrders}`,
    `*Processing Orders:* ${report.totals.processingOrders}`,
    `*Shipped Orders:* ${report.totals.shippedOrders}`,
    `*Delivered Orders:* ${report.totals.deliveredOrders}`,
    `*Rejected Orders:* ${report.totals.rejectedOrders}`,
    `*Refunded Orders:* ${report.totals.refundedOrders}`,
    `*Paid Orders:* ${report.totals.paidOrders}`,
    `*Unpaid Orders:* ${report.totals.unpaidOrders}`,
    `*Revenue:* ${formatCurrency(report.revenue)}`,
    `*New Customers:* ${report.newCustomers}`,
    `*Low Stock Products:* ${report.inventory.lowStockProducts}`,
    `*Out of Stock Products:* ${report.inventory.outOfStockProducts}`,
    `*Best Selling Products:* ${report.inventory.bestSellingProducts.join(', ') || 'N/A'}`,
    `*Worst Selling Products:* ${report.inventory.worstSellingProducts.join(', ') || 'N/A'}`,
  ];
  return lines.join('\n');
}

export async function getTelegramDashboardReport() {
  await dbConnect();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const orders = await Order.find({}).lean();
  const totalOrders = orders.length;
  const completedOrders = orders.filter((order) => order.status === 'Delivered').length;
  const pendingOrders = orders.filter((order) => ['Payment Pending', 'Payment Processing', 'Order Preparing'].includes(order.status)).length;
  const processingOrders = orders.filter((order) => order.status === 'Order Preparing').length;
  const shippedOrders = orders.filter((order) => order.status === 'Shipped').length;
  const deliveredOrders = orders.filter((order) => order.status === 'Delivered').length;
  const rejectedOrders = orders.filter((order) => order.status === 'Order Rejected').length;
  const refundedOrders = orders.filter((order) => ['Refund Pending', 'Refund Approved', 'Refund Processed'].includes(String(order.refundStatus))).length;
  const paidOrders = orders.filter((order) => ['Payment Verified', 'Payment Completed', 'Payment Processing'].includes(String(order.status))).length;
  const unpaidOrders = orders.filter((order) => ['Payment Pending', 'Payment Failed', 'Payment Rejected'].includes(String(order.status))).length;
  const revenue = orders.filter((order) => !['Payment Pending', 'Payment Failed', 'Order Rejected'].includes(String(order.status))).reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const newCustomers = await User.countDocuments({ createdAt: { $gte: todayStart } });

  const lowStockProducts = await Product.countDocuments({ quantity: { $lte: 5, $gt: 0 } });
  const outOfStockProducts = await Product.countDocuments({ quantity: { $lte: 0 } });
  const bestSellingProducts = await Order.aggregate([
    { $unwind: '$products' },
    { $group: { _id: '$products.productName', totalQuantity: { $sum: '$products.quantity' } } },
    { $sort: { totalQuantity: -1 } },
    { $limit: 3 },
    { $project: { _id: 0, name: '$_id' } },
  ]);
  const worstSellingProducts = await Order.aggregate([
    { $unwind: '$products' },
    { $group: { _id: '$products.productName', totalQuantity: { $sum: '$products.quantity' } } },
    { $sort: { totalQuantity: 1 } },
    { $limit: 3 },
    { $project: { _id: 0, name: '$_id' } },
  ]);

  return {
    today: buildTelegramReportText({
      title: "Today's Report",
      totals: { totalOrders, completedOrders, pendingOrders, processingOrders, shippedOrders, deliveredOrders, rejectedOrders, refundedOrders, paidOrders, unpaidOrders },
      revenue,
      newCustomers,
      inventory: {
        lowStockProducts,
        outOfStockProducts,
        bestSellingProducts: bestSellingProducts.map((item: { name?: string }) => item.name || 'N/A'),
        worstSellingProducts: worstSellingProducts.map((item: { name?: string }) => item.name || 'N/A'),
      },
    }),
    monthly: buildTelegramReportText({
      title: 'Monthly Report',
      totals: { totalOrders, completedOrders, pendingOrders, processingOrders, shippedOrders, deliveredOrders, rejectedOrders, refundedOrders, paidOrders, unpaidOrders },
      revenue,
      newCustomers,
      inventory: {
        lowStockProducts,
        outOfStockProducts,
        bestSellingProducts: bestSellingProducts.map((item: { name?: string }) => item.name || 'N/A'),
        worstSellingProducts: worstSellingProducts.map((item: { name?: string }) => item.name || 'N/A'),
      },
    }),
    inventory: buildTelegramReportText({
      title: 'Inventory Report',
      totals: { totalOrders, completedOrders, pendingOrders, processingOrders, shippedOrders, deliveredOrders, rejectedOrders, refundedOrders, paidOrders, unpaidOrders },
      revenue,
      newCustomers,
      inventory: {
        lowStockProducts,
        outOfStockProducts,
        bestSellingProducts: bestSellingProducts.map((item: { name?: string }) => item.name || 'N/A'),
        worstSellingProducts: worstSellingProducts.map((item: { name?: string }) => item.name || 'N/A'),
      },
    }),
  };
}

export async function notifyAdminsInventoryUpdate(product: ProductDocument, previousQuantity?: number) {
  try {
    const currentQuantity = Number(product.quantity ?? 0);
    const previousStock = Number(previousQuantity ?? currentQuantity);
    const lowThreshold = Number(process.env.TELEGRAM_LOW_STOCK_THRESHOLD || 5);
    const isLow = currentQuantity <= lowThreshold && currentQuantity > 0;
    const isOut = currentQuantity <= 0;
    const wasLow = previousStock <= lowThreshold && previousStock > 0;
    const wasOut = previousStock <= 0;

    if ((isOut && !wasOut) || (isLow && !wasLow)) {
      const title = isOut ? '⚠️ Product Out of Stock' : '⚠️ Product Low Stock';
      const message = [
        title,
        `*Product:* ${product.name}`,
        `*Stock:* ${currentQuantity}`,
        `*Status:* ${product.status || 'active'}`,
      ].join('\n');
      await publishTelegramMessageToAdmins(message, { replyMarkup: buildInventoryActionsKeyboard(product._id.toString()) });
    }
  } catch (error) {
    console.error('notifyAdminsInventoryUpdate failed', error);
  }
}

export async function notifyAdminsNewPremiumCardOrder(order: {
  _id?: unknown;
  orderId?: string;
  userName?: string;
  userEmail?: string;
  userWhatsApp?: string;
  cardName?: string;
  categoryName?: string;
  price?: number;
  status?: string;
  paymentScreenshot?: string;
  utrNumber?: string;
  transactionId?: string;
  remark?: string;
  createdAt?: Date | string;
}) {
  try {
    const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
    const caption = [
      '*New Premium Card Order*',
      `*Order ID:* ${escapeTelegramText(order.orderId || String(order._id ?? 'N/A'))}`,
      `*Customer:* ${escapeTelegramText(order.userName || 'Guest')}`,
      `*Email:* ${escapeTelegramText(order.userEmail || 'N/A')}`,
      `*WhatsApp:* ${escapeTelegramText(order.userWhatsApp || 'N/A')}`,
      `*WhatsApp:* ${escapeTelegramText(order.userWhatsApp || 'N/A')}`,
      `*Card:* ${escapeTelegramText(order.cardName || 'N/A')}`,
      `*Category:* ${escapeTelegramText(order.categoryName || 'N/A')}`,
      `*Amount:* ${formatCurrency(order.price ?? 0)}`,
      `*Status:* ${escapeTelegramText(order.status || 'pending')}`,
      `*UTR:* ${escapeTelegramText(order.utrNumber || 'N/A')}`,
      `*Transaction ID:* ${escapeTelegramText(order.transactionId || 'N/A')}`,
      `*Remark:* ${escapeTelegramText(order.remark || 'N/A')}`,
      `*Ordered At:* ${escapeTelegramText(orderTime)}`,
      '',
      'Verify payment and release card details to the customer.',
    ].join('\n');

    const screenshot = String(order.paymentScreenshot || '');
    const keyboard = buildPremiumCardActionsKeyboard(String(order._id || ''));
    if (screenshot) {
      await publishTelegramPhotoToAdmins(screenshot, caption, keyboard);
    } else {
      await publishTelegramMessageToAdmins(caption, { replyMarkup: keyboard });
    }
  } catch (error) {
    console.error('notifyAdminsNewPremiumCardOrder failed', error);
  }
}

export async function notifyAdminsNewOrder(order: OrderDocument) {
  try {
    console.log('[notifyAdminsNewOrder] invoked for order', String(order?._id ?? 'unknown'), 'orderNumber', String(order?.orderNumber ?? 'N/A'));
    try {
      console.log('[notifyAdminsNewOrder] runtime Telegram config', resolveTelegramConfig());
    } catch (e) {
      console.warn('[notifyAdminsNewOrder] failed to resolve Telegram config for debug', e);
    }
    const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
    const customer = order.customer && typeof order.customer === 'object' ? order.customer : null;
    const customerName = order.shipping?.name || (customer && 'name' in customer ? String(customer.name ?? 'N/A') : 'N/A');
    const customerEmail = order.shipping?.email || (customer && 'email' in customer ? String(customer.email ?? 'N/A') : 'N/A');
    const customerPhone = order.shipping?.mobile || (customer && 'mobile' in customer ? String(customer.mobile ?? 'N/A') : 'N/A');
    const username = (customer && 'customerId' in customer ? String(customer.customerId ?? '') : '') || 'N/A';
    const caption = [
      '*New Order Placed*',
      `*Order:* ${escapeTelegramText(order.orderNumber)}`,
      `*Customer:* ${escapeTelegramText(customerName)}`,
      `*Username:* ${escapeTelegramText(username)}`,
      `*Email:* ${escapeTelegramText(customerEmail)}`,
      `*Phone:* ${escapeTelegramText(customerPhone)}`,
      `*Products:* ${buildOrderTelegramItems(order)}`,
      `*Quantity:* ${escapeTelegramText((order.products || []).reduce((sum, item) => sum + (item.quantity || 0), 0))}`,
      `*Total:* ${formatCurrency(order.total)}`,
      `*Payment Method:* ${escapeTelegramText(order.paymentMethod || 'manual')}`,
      `*Payment Status:* ${escapeTelegramText(order.status)}`,
      `*Order Time:* ${escapeTelegramText(orderTime)}`,
      `*Shipping Address:* ${escapeTelegramText([order.shipping?.address, order.shipping?.city, order.shipping?.state, order.shipping?.postalCode, order.shipping?.country].filter(Boolean).join(', ') || 'N/A')}`,
      `*User Notes:* ${escapeTelegramText((order as any).notes || 'N/A')}`,
      `*Payment Proof:* ${order.paymentScreenshot ? 'Uploaded' : 'Not uploaded'}`,
      '',
      'Use the buttons below to review the order.']
        .join('\n');
    const screenshot = String(order.paymentScreenshot || '');
    const keyboard = buildOrderActionsKeyboard(order._id.toString(), order.paymentMethod ?? undefined);
    if (screenshot) {
      await publishTelegramPhotoToAdmins(screenshot, caption, keyboard);
    } else {
      await publishTelegramMessageToAdmins(caption, { replyMarkup: keyboard });
    }
  } catch (error) {
    console.error('notifyAdminsNewOrder failed', error);
  }
}

export async function notifyAdminsPaymentProof(order: OrderDocument) {
  try {
    const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
    const caption = [`*Payment Proof Uploaded*`, `*Order:* ${escapeTelegramText(order.orderNumber)}`, `*Customer:* ${escapeTelegramText(order.shipping?.name || 'N/A')}`, `*Amount:* ${formatCurrency(order.total)}`, `*Payment Method:* ${escapeTelegramText(order.paymentMethod || 'manual')}`, `*Upload Time:* ${escapeTelegramText(orderTime)}`, ``, `Approve or reject payment directly from Telegram.`].join('\n');
    const screenshot = String(order.paymentScreenshot || '');
    const keyboard = buildPaymentActionsKeyboard(order._id.toString(), order.paymentMethod ?? undefined);
    if (screenshot) {
      await publishTelegramPhotoToAdmins(screenshot, caption, keyboard);
    } else {
      await publishTelegramMessageToAdmins(caption, { replyMarkup: keyboard });
    }
  } catch (error) {
    console.error('notifyAdminsPaymentProof failed', error);
  }
}

export async function notifyAdminsOrderUpdate(order: OrderDocument, action: string) {
  try {
    const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
    const caption = [`*Order Updated*`, `*Order:* ${escapeTelegramText(order.orderNumber)}`, `*Action:* ${escapeTelegramText(action)}`, `*Status:* ${escapeTelegramText(order.status)}`, `*Total:* ${formatCurrency(order.total)}`, `*Customer:* ${escapeTelegramText(order.shipping?.name || 'N/A')}`, `*Phone:* ${escapeTelegramText(order.shipping?.mobile || 'N/A')}`, `*Order Time:* ${escapeTelegramText(orderTime)}`].join('\n');
    await publishTelegramMessageToAdmins(caption, { replyMarkup: buildOrderActionsKeyboard(order._id.toString(), order.paymentMethod ?? undefined) });
  } catch (error) {
    console.error('notifyAdminsOrderUpdate failed', error);
  }
}
