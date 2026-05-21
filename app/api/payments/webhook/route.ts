import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Shipment from '@/models/Shipment';
import Product from '@/models/Product';
import { createNotificationAndPush } from '@/lib/notifications';
import { notifyOrderLifecycle } from '@/lib/notificationService';

interface CashfreePaymentWebhook {
  order_id: string;
  order_amount: string;
  order_currency: string;
  order_status: string;
  payment: {
    cf_payment_id: string;
    payment_status: string;
    payment_message: string;
    payment_method: {
      type: string;
      utr?: string;
      vpa?: string;
      card?: {
        last_4_digits?: string;
        network?: string;
      };
      netbanking?: {
        bank_name?: string;
      };
    };
    amount: string;
    date: string;
  };
  event: string;
}

interface RazorpayPaymentWebhook {
  event: string;
  data: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        card_id?: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        email?: string;
        contact?: string;
        fee?: number;
        tax?: number;
        error_code?: string;
        error_description?: string;
        created_at: number;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Webhook JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Determine webhook type based on payload structure
    const isRazorpay = body.event && body.data && body.data.payment;
    const isCashfree = body.order_id && body.order_status;

    if (!isRazorpay && !isCashfree) {
      console.error('Unknown webhook format');
      return NextResponse.json({ error: 'Unknown webhook format' }, { status: 400 });
    }

    let orderId: string;
    let paymentStatus: string;
    let paymentProvider: string;
    let paymentDetails: any = {};

    if (isRazorpay) {
      // Handle Razorpay webhook
      const razorpayData = body as RazorpayPaymentWebhook;
      const signature = request.headers.get('x-razorpay-signature');
      const secretKey = process.env.RAZORPAY_WEBHOOK_SECRET;

      // Verify Razorpay webhook signature
      if (process.env.NODE_ENV === 'production') {
        if (!signature || !secretKey) {
          console.warn('Razorpay webhook signature missing or secret not configured');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const isValid = verifyRazorpaySignature(rawBody, signature, secretKey);
        if (!isValid) {
          console.warn('Invalid Razorpay webhook signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }

      const payment = razorpayData.data.payment.entity;
      orderId = payment.order_id;
      paymentStatus = payment.status;
      paymentProvider = 'razorpay';
      paymentDetails = {
        razorpayPaymentId: payment.id,
        paymentStatus: payment.status,
        paymentMethod: payment.method,
        amount: payment.amount,
        currency: payment.currency,
        created_at: payment.created_at,
      };

      console.log('Razorpay webhook received:', {
        orderId: orderId,
        event: razorpayData.event,
        status: paymentStatus,
      });

    } else {
      // Handle Cashfree webhook
      const signature = request.headers.get('x-cf-signature');
      const secretKey = process.env.CASHFREE_SECRET_KEY;

      console.log('Cashfree webhook received:', {
        orderId: body.order_id,
        event: body.event,
        status: body.order_status,
      });

      // Verify webhook signature for security
      if (process.env.CASHFREE_ENV === 'production') {
        if (!signature || !secretKey) {
          console.warn('Webhook signature missing or secret not configured');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const isValid = verifyWebhookSignature(rawBody, signature, secretKey);
        if (!isValid) {
          console.warn('Invalid webhook signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      } else if (signature && secretKey) {
        const isValid = verifyWebhookSignature(rawBody, signature, secretKey);
        if (!isValid) {
          console.warn('Invalid webhook signature in non-production mode; continuing because env is not production');
        }
      }

      const webhookData = body as CashfreePaymentWebhook;
      orderId = webhookData.order_id;
      paymentStatus = webhookData.payment?.payment_status || webhookData.order_status;
      paymentProvider = 'cashfree';
      paymentDetails = {
        cfPaymentId: webhookData.payment?.cf_payment_id,
        paymentStatus: webhookData.payment?.payment_status,
        paymentMessage: webhookData.payment?.payment_message,
        utr: webhookData.payment?.payment_method?.utr,
        vpa: webhookData.payment?.payment_method?.vpa,
      };
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    await dbConnect();

    // Find the order by orderId, cfOrderId, razorpayOrderId, or orderNumber
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { cfOrderId: orderId },
        { razorpayOrderId: orderId },
        { orderNumber: orderId },
      ],
    }).populate('customer');

    if (!order) {
      console.error('Order not found for webhook:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order based on payment status
    switch (paymentStatus.toLowerCase()) {
      case 'captured':
      case 'success':
      case 'paid':
        if (order.status === 'Payment Pending' || order.status === 'Payment Completed' || order.status === 'Payment Processing') {
          const shouldReserveStock = paymentProvider === 'cashfree' || paymentProvider === 'razorpay';
          
          order.status = 'Payment Verified';
          order.paymentVerifiedAt = new Date();
          order.paymentMethod = 'online';

          if (paymentProvider === 'cashfree') {
            if (!order.cfOrderId && orderId) {
              order.cfOrderId = orderId;
            }
            order.cfPaymentId = paymentDetails.cfPaymentId;
            order.transactionId = paymentDetails.cfPaymentId || paymentDetails.utr || '';
          } else if (paymentProvider === 'razorpay') {
            if (!order.razorpayOrderId && orderId) {
              order.razorpayOrderId = orderId;
            }
            order.razorpayPaymentId = paymentDetails.razorpayPaymentId;
            order.transactionId = paymentDetails.razorpayPaymentId || '';
          }

          order.paymentDetails = paymentDetails;

          if (shouldReserveStock) {
            for (const item of order.products) {
              try {
                const product = await Product.findById(item.product);
                if (product) {
                  if (product.quantity >= item.quantity) {
                    product.quantity -= item.quantity;
                    await product.save();
                  } else {
                    console.warn(`Low stock when confirming ${paymentProvider} order ${order._id}: ${item.product}`);
                  }
                }
              } catch (productError) {
                console.error(`Failed to reserve stock on ${paymentProvider} payment success:`, productError);
              }
            }
          }

          await order.save();

          const shippingInfo = order.shipping
            ? {
                name: order.shipping.name ?? undefined,
                email: order.shipping.email ?? undefined,
                mobile: order.shipping.mobile ?? undefined,
              }
            : undefined;

          // Send notification to customer
          try {
            await notifyOrderLifecycle({
              _id: order._id?.toString(),
              customerId: order.customer?.toString(),
              orderNumber: order.orderNumber ?? undefined,
              shipping: shippingInfo,
            }, 'payment-success');
          } catch (notifError) {
            console.error('Failed to send payment success notification:', notifError);
          }
          
          console.log(`Payment verified for ${paymentProvider} order ${order.orderNumber || order._id}`);
        }
        break;

      case 'failed':
      case 'failure':
        order.status = 'Payment Failed';
        order.paymentFailureReason = paymentDetails.paymentMessage || paymentDetails.error_description || 'Payment failed';
        await order.save();
        
        try {
          const customerId = order.customer?._id || order.customer;
          if (customerId) {
            await createNotificationAndPush({
              userId: customerId.toString(),
              type: 'order-status',
              message: `Payment failed for order ${order.orderNumber || order._id}. Please try again.`,
              meta: { orderId: order._id.toString() },
            });
          }
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
        
        console.log(`Payment failed for ${paymentProvider} order ${order.orderNumber || order._id}`);
        break;

      case 'pending':
      case 'processing':
        if (order.status === 'Payment Pending') {
          order.status = 'Payment Processing';
          await order.save();
        }
        break;

      default:
        console.log('Unhandled payment status:', paymentStatus);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed',
      orderId: orderId,
      status: paymentStatus,
      provider: paymentProvider,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Verify Cashfree webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('base64');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Verify Razorpay webhook signature
function verifyRazorpaySignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
}

// Handle other webhook events
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Cashfree webhook endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}