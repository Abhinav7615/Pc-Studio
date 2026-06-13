import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import { releaseExpiredReservations } from '@/lib/reservationCleanup';
import { notifyOrderLifecycle } from '@/lib/notificationService';
import { notifyAdminsNewOrder } from '@/telegramBot/helpers';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    await releaseExpiredReservations();

    const user = await User.findById(session.user.id);
    if (!user || user.blocked) {
      return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
    }

    const body = await request.json();
    const {
      cart,
      name,
      email,
      address,
      city,
      state,
      postalCode,
      country,
      mobile,
      paymentMethod,
      cfOrderId,
      cfPaymentId,
      razorpayOrderId,
      razorpayPaymentId,
      discountCoupon,
      shippingCharges = 0,
      shippingState,
    } = body;

    const shippingChargesNumber = Number(shippingCharges) || 0;
    const cleanDiscountCoupon = discountCoupon ? String(discountCoupon).trim().toUpperCase() : undefined;

    let coupon = null;
    if (cleanDiscountCoupon) {
      coupon = await Coupon.findOne({ code: cleanDiscountCoupon });
      if (!coupon) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
      }
      if (coupon.user && coupon.user.toString() !== session.user.id) {
        return NextResponse.json({ error: 'This coupon is not available for your account' }, { status: 403 });
      }
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is required' }, { status: 400 });
    }

    // For online payments (Cashfree/Razorpay), we don't require screenshot/transactionId upfront
    // They will be provided via webhook after payment
    if (paymentMethod === 'manual') {
      if (!body.paymentScreenshot || !body.transactionId) {
        return NextResponse.json({ error: 'Please provide payment screenshot and transaction ID' }, { status: 400 });
      }
    }

    if (!name || !email || !address || !city || !state || !postalCode || !country || !mobile) {
      return NextResponse.json({ error: 'Please provide all shipping details' }, { status: 400 });
    }

    const cartItems = Array.isArray(cart)
      ? cart.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        }))
      : [];

    let total = 0;
    const orderProducts: Array<{ product: string; productName: string; quantity: number; price: number; gstPercent: number; discountPercent: number }> = [];

    const reserveStockImmediately = paymentMethod !== 'cashfree' && paymentMethod !== 'razorpay';

    for (const item of cart) {
      if (!item?.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 });
      }

      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
      }

      if (product.quantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient quantity for ${product.name}. Available: ${product.quantity}` }, { status: 400 });
      }

      const price = product.originalPrice * (1 - product.discountPercent / 100);
      const gstPercent = product.gstPercent || 0;
      const itemTotal = price * item.quantity;
      const gstAmount = itemTotal * (gstPercent / 100);
      total += itemTotal + gstAmount;

      orderProducts.push({
        product: product._id as string,
        productName: product.name,
        quantity: item.quantity,
        price: price,
        gstPercent: gstPercent,
        discountPercent: product.discountPercent,
      });

      if (reserveStockImmediately) {
        // Reserve stock only for manual payments; for online orders (Cashfree/Razorpay) we wait until payment succeeds.
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    // Apply coupon discount
    let discountAmount = 0;
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discountAmount = (total * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }
      total -= discountAmount;
    }

    total += shippingChargesNumber;

    // Determine initial status based on payment method
    let initialStatus = 'Payment Pending';
    if (paymentMethod === 'cashfree' || paymentMethod === 'razorpay') {
      // For online payments, order will be updated via webhook
      initialStatus = 'Payment Processing';
    }

    const order = new Order({
      customer: session.user.id,
      products: orderProducts,
      total: Math.round(total * 100) / 100,
      status: initialStatus,
      shipping: { name, email, address, city, postalCode, country, mobile },
      discountCoupon: cleanDiscountCoupon,
      discountAmount: Math.round(discountAmount * 100) / 100,
      shippingCharges: shippingChargesNumber,
      shippingState,
      
      // Payment fields
      cfOrderId: cfOrderId || undefined,
      cfPaymentId: cfPaymentId || undefined,
      razorpayOrderId: razorpayOrderId || undefined,
      razorpayPaymentId: razorpayPaymentId || undefined,
      paymentMethod: paymentMethod || 'manual',
      
      // Manual payment fields
      paymentScreenshot: body.paymentScreenshot || undefined,
      transactionId: body.transactionId || undefined,
    });

    await order.save();

    await notifyAdminsNewOrder(order);

    // Update coupon usage
    if (coupon) {
      coupon.usedBy = (coupon.usedBy || 0) + 1;
      await coupon.save();
    }

    const shippingInfo = order.shipping
      ? {
          name: order.shipping.name ?? undefined,
          email: order.shipping.email ?? undefined,
          mobile: order.shipping.mobile ?? undefined,
        }
      : undefined;

    try {
      await notifyOrderLifecycle({
        _id: order._id?.toString(),
        customerId: session.user.id,
        orderNumber: order.orderNumber ?? undefined,
        shipping: shippingInfo,
      }, 'order-placed');
    } catch (notifError) {
      console.error('Failed to send order lifecycle notification:', notifError);
    }

    return NextResponse.json({
      _id: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      message: (paymentMethod === 'cashfree' || paymentMethod === 'razorpay') 
        ? 'Order created. Please complete payment.'
        : 'Order placed successfully! Please complete payment.',
    });

  } catch (err) {
    console.error('POST /api/payments/create-order - Error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}