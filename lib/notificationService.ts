import { createNotificationAndPush } from '@/lib/notifications';
import { sendEmail } from '@/lib/sendEmail';
import { sendSmsMessage } from '@/lib/sendSms';
import { sendWhatsAppMessage } from '@/lib/sendWhatsapp';

export type OrderLifecycleEvent =
  | 'order-placed'
  | 'payment-success'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund-processed'
  | 'return-requested'
  | 'return-approved'
  | 'return-rejected'
  | 'return-received';

interface OrderData {
  _id?: string;
  customerId?: string;
  orderNumber?: string;
  shipping?: {
    name?: string;
    email?: string;
    mobile?: string;
  };
  deliveryCompanyName?: string;
  trackingId?: string;
}

function buildMessages(order: OrderData, event: OrderLifecycleEvent, extra?: { reason?: string }): { subject: string; emailHtml: string; emailText: string; sms: string; whatsapp: string; notificationMessage: string } {
  const orderNumber = order.orderNumber || 'your order';
  const customerName = order.shipping?.name || 'Customer';
  const courierName = order.deliveryCompanyName || 'your delivery partner';
  const trackingId = order.trackingId || 'N/A';
  const reason = extra?.reason ? ` Reason: ${extra.reason}` : '';

  let subject = '';
  let notificationMessage = '';
  let sms = '';
  let whatsapp = '';
  let emailHtml = '';
  let emailText = '';

  switch (event) {
    case 'order-placed':
      subject = `Order ${orderNumber} received`;
      notificationMessage = `Order ${orderNumber} has been placed successfully.`;
      sms = `Hi ${customerName}, your order ${orderNumber} has been received. We will notify you when payment is confirmed.`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nThank you for placing order ${orderNumber}. We have received your order and will notify you once payment is confirmed.\n\nThank you,\nRefurbished PC Studio`;
      emailHtml = `<p>Hello ${customerName},</p><p>Thank you for placing order <strong>${orderNumber}</strong>. We have received your order and will notify you once payment is confirmed.</p><p>Thank you,<br/>Refurbished PC Studio</p>`;
      break;
    case 'payment-success':
      subject = `Payment confirmed for order ${orderNumber}`;
      notificationMessage = `Payment received for order ${orderNumber}.`; 
      sms = `Hi ${customerName}, payment for order ${orderNumber} is confirmed. Your order is now being processed.`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nYour payment for order ${orderNumber} has been confirmed. Your order is now being processed for shipment.\n\nThank you,\nRefurbished PC Studio`;
      emailHtml = `<p>Hello ${customerName},</p><p>Your payment for order <strong>${orderNumber}</strong> has been confirmed. Your order is now being processed for shipment.</p><p>Thank you,<br/>Refurbished PC Studio</p>`;
      break;
    case 'shipped':
      subject = `Order ${orderNumber} has shipped`;
      notificationMessage = `Order ${orderNumber} has been shipped via ${courierName}. Tracking ID: ${trackingId}.`;
      sms = `Hi ${customerName}, your order ${orderNumber} has been shipped via ${courierName}. Tracking ID: ${trackingId}.`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nGreat news! Your order ${orderNumber} has been shipped via ${courierName}. Tracking ID: ${trackingId}.\n\nThank you for shopping with us.`;
      emailHtml = `<p>Hello ${customerName},</p><p>Great news! Your order <strong>${orderNumber}</strong> has been shipped via <strong>${courierName}</strong>.</p><p>Tracking ID: <strong>${trackingId}</strong></p><p>Thank you for shopping with us.</p>`;
      break;
    case 'delivered':
      subject = `Order ${orderNumber} delivered`;
      notificationMessage = `Your order ${orderNumber} has been delivered.`;
      sms = `Hi ${customerName}, your order ${orderNumber} has been delivered. Thank you for shopping with us!`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nYour order ${orderNumber} has been delivered. We hope you enjoy your purchase.\n\nThank you,\nRefurbished PC Studio`;
      emailHtml = `<p>Hello ${customerName},</p><p>Your order <strong>${orderNumber}</strong> has been delivered. We hope you enjoy your purchase.</p><p>Thank you,<br/>Refurbished PC Studio</p>`;
      break;
    case 'cancelled':
      subject = `Order ${orderNumber} cancelled`;
      notificationMessage = `Order ${orderNumber} has been cancelled.${reason}`;
      sms = `Hi ${customerName}, your order ${orderNumber} has been cancelled.${reason}`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nYour order ${orderNumber} has been cancelled.${reason}\n\nIf you have any questions, contact us.`;
      emailHtml = `<p>Hello ${customerName},</p><p>Your order <strong>${orderNumber}</strong> has been cancelled.${reason}</p><p>If you have any questions, please contact us.</p>`;
      break;
    case 'refund-processed':
      subject = `Refund processed for order ${orderNumber}`;
      notificationMessage = `Refund for order ${orderNumber} has been processed.`;
      sms = `Hi ${customerName}, refund for order ${orderNumber} has been processed. It may take a few business days to reflect.`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nYour refund for order ${orderNumber} has been processed. It may take a few business days to reflect in your account.\n\nThank you.`;
      emailHtml = `<p>Hello ${customerName},</p><p>Your refund for order <strong>${orderNumber}</strong> has been processed. It may take a few business days to reflect in your account.</p><p>Thank you.</p>`;
      break;
    case 'return-requested':
      subject = `Return requested for order ${orderNumber}`;
      notificationMessage = `Return requested for order ${orderNumber}.`; 
      sms = `Hi ${customerName}, we have received your return request for order ${orderNumber}. Our team will review it shortly.`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nWe have received your return request for order ${orderNumber}. Our team will review it shortly.\n\nThank you.`;
      emailHtml = `<p>Hello ${customerName},</p><p>We have received your return request for order <strong>${orderNumber}</strong>. Our team will review it shortly.</p><p>Thank you.</p>`;
      break;
    case 'return-approved':
      subject = `Return approved for order ${orderNumber}`;
      notificationMessage = `Your return for order ${orderNumber} has been approved.`;
      sms = `Hi ${customerName}, your return request for order ${orderNumber} has been approved. Please follow the return instructions.`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nYour return request for order ${orderNumber} has been approved. Please follow the return instructions provided by our team.\n\nThank you.`;
      emailHtml = `<p>Hello ${customerName},</p><p>Your return request for order <strong>${orderNumber}</strong> has been approved. Please follow the return instructions provided by our team.</p><p>Thank you.</p>`;
      break;
    case 'return-rejected':
      subject = `Return rejected for order ${orderNumber}`;
      notificationMessage = `Your return request for order ${orderNumber} has been rejected.${reason}`;
      sms = `Hi ${customerName}, your return request for order ${orderNumber} has been rejected.${reason}`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nYour return request for order ${orderNumber} has been rejected.${reason}\n\nPlease contact support if you have questions.`;
      emailHtml = `<p>Hello ${customerName},</p><p>Your return request for order <strong>${orderNumber}</strong> has been rejected.${reason}</p><p>Please contact support if you have questions.</p>`;
      break;
    case 'return-received':
      subject = `Return received for order ${orderNumber}`;
      notificationMessage = `We have received the returned item for order ${orderNumber}.`;
      sms = `Hi ${customerName}, we have received the returned item for order ${orderNumber}. Our team will process the refund soon.`;
      whatsapp = sms;
      emailText = `Hello ${customerName},\n\nWe have received the returned item for order ${orderNumber}. Our team will process the refund soon.\n\nThank you.`;
      emailHtml = `<p>Hello ${customerName},</p><p>We have received the returned item for order <strong>${orderNumber}</strong>. Our team will process the refund soon.</p><p>Thank you.</p>`;
      break;
  }

  return { subject, emailHtml, emailText, sms, whatsapp, notificationMessage };
}

export async function notifyOrderLifecycle(order: OrderData, event: OrderLifecycleEvent, extra?: { reason?: string }) {
  const email = order.shipping?.email;
  const phone = order.shipping?.mobile;
  const { subject, emailHtml, emailText, sms, whatsapp, notificationMessage } = buildMessages(order, event, extra);

  try {
    await createNotificationAndPush({
      userId: order.customerId || null,
      type: 'order-status',
      message: notificationMessage,
      meta: { orderId: order._id?.toString(), event },
    });
  } catch (error) {
    console.error('Notification DB create or push failed:', error);
  }

  const channelPromises: Promise<unknown>[] = [];

  if (email) {
    channelPromises.push(sendEmail(email, subject, emailHtml, emailText).catch(error => {
      console.error('Order lifecycle email failed:', error);
      return null;
    }));
  }

  if (phone) {
    channelPromises.push(sendSmsMessage(phone, sms).catch(error => {
      console.error('Order lifecycle SMS failed:', error);
      return null;
    }));
    channelPromises.push(sendWhatsAppMessage(phone, whatsapp).catch(error => {
      console.error('Order lifecycle WhatsApp failed:', error);
      return null;
    }));
  }

  await Promise.all(channelPromises);
}
