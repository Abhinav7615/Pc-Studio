import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { createNotification } from '@/lib/notifications';

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
    const { order_id, order_status, payment } = webhookData;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    await dbConnect();

    // Find the order by orderId, cfOrderId, or orderNumber
    const order = await Order.findOne({
      $or: [
        { _id: order_id },
        { cfOrderId: order_id },
        { orderNumber: order_id },
      ],
    }).populate('customer');

    if (!order) {
      console.error('Order not found for webhook:', order_id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order based on payment status
    const paymentStatus = payment?.payment_status || order_status;
    
    // Update cfOrderId if not already set
    if (!order.cfOrderId && order_id) {
      order.cfOrderId = order_id;
    }
    
    switch (paymentStatus) {
      case 'SUCCESS':
      case 'captured':
        if (order.status === 'Payment Pending' || order.status === 'Payment Completed' || order.status === 'Payment Processing') {
          const shouldReserveStock = order.paymentMethod === 'cashfree';
          order.status = 'Payment Verified';
          order.paymentVerifiedAt = new Date();

          if (payment) {
            order.transactionId = payment.cf_payment_id || payment.payment_method?.utr || '';
            order.cfPaymentId = payment.cf_payment_id;
            order.paymentMethod = 'online';
            order.paymentDetails = {
              cfPaymentId: payment.cf_payment_id,
              paymentStatus: payment.payment_status,
              paymentMessage: payment.payment_message,
              utr: payment.payment_method?.utr,
              vpa: payment.payment_method?.vpa,
            };
          }

          if (shouldReserveStock) {
            for (const item of order.products) {
              try {
                const product = await Product.findById(item.product);
                if (product) {
                  if (product.quantity >= item.quantity) {
                    product.quantity -= item.quantity;
                    await product.save();
                  } else {
                    console.warn(`Low stock when confirming Cashfree order ${order._id}: ${item.product}`);
                  }
                }
              } catch (productError) {
                console.error('Failed to reserve stock on payment success:', productError);
              }
            }
          }

          await order.save();
          
          // Send notification to customer
          try {
            const customerId = order.customer?._id || order.customer;
            if (customerId) {
              await createNotification({
                userId: customerId.toString(),
                type: 'order-status',
                message: `Payment verified for order ${order.orderNumber || order._id}. Order is being processed.`,
                meta: { orderId: order._id.toString() },
              });
            }
          } catch (notifError) {
            console.error('Failed to create notification:', notifError);
          }
          
          console.log(`Payment verified for order ${order.orderNumber || order._id}`);
        }
        break;

      case 'FAILED':
      case 'failed':
        order.status = 'Payment Failed';
        order.paymentFailureReason = payment?.payment_message || 'Payment failed';
        await order.save();
        
        try {
          const customerId = order.customer?._id || order.customer;
          if (customerId) {
            await createNotification({
              userId: customerId.toString(),
              type: 'order-status',
              message: `Payment failed for order ${order.orderNumber || order._id}. Please try again.`,
              meta: { orderId: order._id.toString() },
            });
          }
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
        
        console.log(`Payment failed for order ${order.orderNumber || order._id}`);
        break;

      case 'pending':
      case 'PENDING':
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
      orderId: order_id,
      status: paymentStatus,
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

// Handle other webhook events
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Cashfree webhook endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}