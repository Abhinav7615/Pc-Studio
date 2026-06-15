import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Notification from '@/models/Notification';
import Device from '@/models/Device';
import { createNotificationAndPush } from '@/lib/notifications';
import { getTelegramApiClient } from './client';
import { Markup } from 'telegraf';
import mongoose from 'mongoose';

export function getAuthorizedTelegramIds(): string[] {
  const raw = process.env.ADMIN_TELEGRAM_IDS || '';
  return raw
    .split(/[,\s]+/) 
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAuthorizedTelegramId(telegramId: number | string) {
  const allowed = getAuthorizedTelegramIds();
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

export function buildOrderActionsKeyboard(orderId: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Accept Order', `order:accept:${orderId}`), Markup.button.callback('❌ Reject Order', `order:reject:${orderId}`)],
    [Markup.button.callback('📦 Mark Processing', `order:mark_processing:${orderId}`), Markup.button.callback('🚚 Mark Shipped', `order:mark_shipped:${orderId}`)],
    [Markup.button.callback('🎉 Mark Delivered', `order:mark_delivered:${orderId}`), Markup.button.callback('💰 Mark Paid', `order:mark_paid:${orderId}`)],
    [Markup.button.callback('⚠ Mark Unpaid', `order:mark_unpaid:${orderId}`), Markup.button.callback('🔄 Refund', `order:refund:${orderId}`)],
    [Markup.button.callback('🔍 View Full Details', `order:view:${orderId}`), Markup.button.callback('📝 Edit Status', `order:edit_status:${orderId}`)],
    [Markup.button.callback('🗑 Delete Order', `order:delete:${orderId}`)],
  ]);
}

export function buildPaymentActionsKeyboard(orderId: string, paymentMethod?: string) {
  const isManualPayment = !paymentMethod || paymentMethod === 'manual' || paymentMethod === 'bank_transfer';

  // Only show approve/reject for manual payments; auto-verified payments skip this
  const buttons = [];
  if (isManualPayment) {
    buttons.push([Markup.button.callback('✅ Approve Payment', `payment:approve:${orderId}`), Markup.button.callback('❌ Reject Payment', `payment:reject:${orderId}`)]);
  }
  
  // Always show request screenshot option
  buttons.push([Markup.button.callback('🔄 Request New Screenshot', `payment:request_screenshot:${orderId}`)]);

  return Markup.inlineKeyboard(buttons);
}

export function buildOrderStatusSelectionKeyboard(orderId: string) {
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
  const chunks: any[] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    chunks.push(buttons.slice(i, i + 2));
  }
  return Markup.inlineKeyboard(chunks);
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

export function formatOrderSummary(order: any) {
  const customer = order.customer || {};
  const items = (order.products || [])
    .map((item: any) => `- ${item.productName} x${item.quantity} @ ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}`)
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

export function formatOrderDetails(order: any) {
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

export function formatProductSummary(product: any) {
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
  const conditions: any[] = [
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
  const conditions: any[] = [
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
  const query: any = {};
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

export async function publishTelegramMessageToAdmins(text: string, extra?: { parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML'; replyMarkup?: unknown; disableWebPagePreview?: boolean }) {
  const chatIds = getAuthorizedTelegramIds();
  if (chatIds.length === 0) {
    console.warn('No ADMIN_TELEGRAM_IDS configured for Telegram notifications.');
    return;
  }

  const telegram = getTelegramApiClient();

  for (const chatId of chatIds) {
    try {
      await telegram.sendMessage(chatId, text, {
        parse_mode: extra?.parseMode ?? 'Markdown',
        disable_web_page_preview: extra?.disableWebPagePreview ?? true,
        ...(typeof extra?.replyMarkup === 'object' && extra.replyMarkup ? extra.replyMarkup : {}),
      } as any);
    } catch (error) {
      console.error('Telegram sendMessage error for admin', chatId, error);
    }
  }
}

export async function publishTelegramPhotoToAdmins(photoUrl: string, caption: string, replyMarkup?: unknown) {
  const chatIds = getAuthorizedTelegramIds();
  if (chatIds.length === 0) {
    console.warn('No ADMIN_TELEGRAM_IDS configured for Telegram photo notifications.');
    return;
  }

  const telegram = getTelegramApiClient();
  for (const chatId of chatIds) {
    try {
      await telegram.sendPhoto(chatId, photoUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup,
      } as any);
    } catch (error) {
      console.error('Telegram sendPhoto error for admin', chatId, error);
    }
  }
}

export async function notifyAdminsNewOrder(order: any) {
  try {
    const caption = [`*New Order Placed*`, `*Order:* ${order.orderNumber}`, `*Customer:* ${order.shipping?.name || 'N/A'}`, `*Email:* ${order.shipping?.email || 'N/A'}`, `*Mobile:* ${order.shipping?.mobile || 'N/A'}`, `*Total:* ${formatCurrency(order.total)}`, `*Payment Method:* ${order.paymentMethod || 'manual'}`, `*Status:* ${order.status}`, `*Order Time:* ${new Date(order.createdAt).toLocaleString()}`, ``, `Use /order ${order.orderNumber} to view details or open the admin panel.`].join('\n');
    const screenshot = normalizeUrl(String(order.paymentScreenshot || ''));
    if (screenshot) {
      await publishTelegramPhotoToAdmins(screenshot, caption, buildOrderActionsKeyboard(order._id.toString()));
    } else {
      await publishTelegramMessageToAdmins(caption, { replyMarkup: buildOrderActionsKeyboard(order._id.toString()) });
    }
  } catch (error) {
    console.error('notifyAdminsNewOrder failed', error);
  }
}

export async function notifyAdminsPaymentProof(order: any) {
  try {
    const caption = [`*Payment Proof Uploaded*`, `*Order:* ${order.orderNumber}`, `*Customer:* ${order.shipping?.name || 'N/A'}`, `*Email:* ${order.shipping?.email || 'N/A'}`, `*Mobile:* ${order.shipping?.mobile || 'N/A'}`, `*Total:* ${formatCurrency(order.total)}`, `*Payment Method:* ${order.paymentMethod || 'manual'}`, `*Order Status:* ${order.status}`, `*Order Time:* ${new Date(order.createdAt).toLocaleString()}`, ``, `Approve or reject payment directly from Telegram.`].join('\n');
    const screenshot = normalizeUrl(String(order.paymentScreenshot || ''));
    const keyboard = buildPaymentActionsKeyboard(order._id.toString(), order.paymentMethod);
    if (screenshot) {
      await publishTelegramPhotoToAdmins(screenshot, caption, keyboard);
    } else {
      await publishTelegramMessageToAdmins(caption, { replyMarkup: keyboard });
    }
  } catch (error) {
    console.error('notifyAdminsPaymentProof failed', error);
  }
}

export async function notifyAdminsOrderUpdate(order: any, action: string) {
  try {
    const caption = [`*Order Updated*`, `*Order:* ${order.orderNumber}`, `*Action:* ${action}`, `*Status:* ${order.status}`, `*Total:* ${formatCurrency(order.total)}`, `*Customer:* ${order.shipping?.name || 'N/A'}`, `*Mobile:* ${order.shipping?.mobile || 'N/A'}`, `*Order Time:* ${new Date(order.createdAt).toLocaleString()}`].join('\n');
    await publishTelegramMessageToAdmins(caption, { replyMarkup: buildOrderActionsKeyboard(order._id.toString()) });
  } catch (error) {
    console.error('notifyAdminsOrderUpdate failed', error);
  }
}
