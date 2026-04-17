import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import BusinessSettings from '@/models/BusinessSettings';
import { releaseExpiredReservations } from '@/lib/reservationCleanup';
import { createNotification } from '@/lib/notifications';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.warn('GET /api/orders - No session found');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    if (!session.user?.id) {
      console.warn('GET /api/orders - Session missing user.id', { userKeys: Object.keys(session.user || {}) });
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
    }

    await dbConnect();
    await releaseExpiredReservations();

    let orders;

    if (session.user.role === 'customer') {
      orders = await Order.find({ customer: session.user.id }).populate('products.product').sort({ createdAt: -1 });
    } else if (session.user.role === 'admin' || session.user.role === 'staff') {
      orders = await Order.find({}).populate('customer', 'name email mobile customerId').populate('products.product').sort({ createdAt: -1 });
    } else {
      console.warn('GET /api/orders - Unauthorized role', { role: session.user.role });
      return NextResponse.json({ error: 'Unauthorized - Invalid role' }, { status: 401 });
    }

    return NextResponse.json(orders, { status: 200 });
  } catch (err) {
    console.error('GET /api/orders - Error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

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
      paymentScreenshot,
      transactionId,
      discountCoupon,
      shippingCharges = 0,
      shippingState,
    } = await request.json();

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

    if (
      !name ||
      !email ||
      !address ||
      !city ||
      !state ||
      !postalCode ||
      !country ||
      !mobile ||
      !paymentScreenshot ||
      !transactionId
    ) {
      return NextResponse.json({ error: 'Please provide all required fields including state' }, { status: 400 });
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

    for (const item of cart) {
      // validate item structure
      if (
        !item?.productId ||
        typeof item.quantity !== 'number' ||
        item.quantity <= 0
      ) {
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
      const gstAmount = price * gstPercent / 100;
      const lineTotal = (price + gstAmount) * item.quantity;
      total += lineTotal;
      orderProducts.push({
        product: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price,
        gstPercent,
        discountPercent: product.discountPercent || 0,
      });
    }

    // Get business settings for referral amounts
    const settings = await BusinessSettings.findOne({});

    // Validate coupon server-side and compute coupon discount, do not trust client-provided discountAmount
    let couponDiscount = 0;
    let _couponProducts: string[] = [];
    let _couponDiscountType = 'fixed';
    let _couponDiscountValue = 0;

    if (coupon) {
      if (coupon.type === 'referral' && (!settings || !settings.referralEnabled)) {
        return NextResponse.json({ error: 'Referral program is currently disabled' }, { status: 400 });
      }

      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return NextResponse.json({ error: 'Cart is required to validate coupon' }, { status: 400 });
      }

      const productIds = cartItems.map((item: any) => item.productId);
      if (coupon.products && coupon.products.length > 0) {
        const allowedProductIds = coupon.products.map((couponProductId: any) => couponProductId.toString());
        const hasAnyValidProduct = productIds.some((cartProductId) => allowedProductIds.includes(cartProductId));
        const hasOnlyValidProducts = productIds.every((cartProductId) => allowedProductIds.includes(cartProductId));
        if (!hasAnyValidProduct) {
          return NextResponse.json({ error: 'This coupon is not valid for the products in your cart' }, { status: 400 });
        }
        if (!hasOnlyValidProducts) {
          return NextResponse.json({ error: 'This coupon can only be used with the selected products' }, { status: 400 });
        }
      }

      const now = new Date();
      const createdAt = new Date(coupon.createdAt);
      if (coupon.expirationDays) {
        const expiryDate = new Date(createdAt.getTime() + coupon.expirationDays * 24 * 60 * 60 * 1000);
        if (now > expiryDate) {
          return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
        }
      }
      if (coupon.expirationHours) {
        const expiryTime = new Date(createdAt.getTime() + coupon.expirationHours * 60 * 60 * 1000);
        if (now > expiryTime) {
          return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
        }
      }
      if (coupon.startHour !== null && coupon.endHour !== null) {
        const currentHour = now.getHours();
        if (currentHour < coupon.startHour || currentHour > coupon.endHour) {
          return NextResponse.json({ error: 'Coupon not valid at this time' }, { status: 400 });
        }
      }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'Coupon usage limit exceeded' }, { status: 400 });
      }

      if (coupon.type === 'bargain' || coupon.type === 'bidding') {
        if (!coupon.targetPrice || !coupon.products || coupon.products.length === 0) {
          return NextResponse.json({ error: 'Invalid coupon details' }, { status: 400 });
        }
        const eligibleItem = cartItems.find((item: any) =>
          coupon.products.some((couponProductId: any) => couponProductId.toString() === item.productId)
        );
        if (!eligibleItem) {
          return NextResponse.json({ error: 'This coupon is not valid for the products in your cart' }, { status: 400 });
        }
        couponDiscount = Math.max(0, eligibleItem.price - coupon.targetPrice);
      } else {
        const discountBase = coupon.products && coupon.products.length > 0
          ? cartItems.reduce((sum: number, item: any) => {
              const matchingCouponProduct = coupon.products.some((couponProdId: any) =>
                couponProdId.toString() === item.productId
              );
              if (matchingCouponProduct) {
                return sum + item.price * item.quantity;
              }
              return sum;
            }, 0)
          : total;

        if (coupon.discountType === 'percentage') {
          couponDiscount = (discountBase * coupon.discountValue) / 100;
        } else {
          couponDiscount = Math.min(coupon.discountValue, discountBase);
        }
      }

      _couponProducts = coupon.products ? coupon.products.map((p: any) => p.toString()) : [];
      _couponDiscountType = coupon.discountType;
      _couponDiscountValue = coupon.discountValue;
    }

    // Discount breakdown for tracking
    const manualCouponDiscount = couponDiscount;
    let referralDiscount = 0;
    let firstOrderDiscount = 0;

    // Check for referral bonuses
    const customer = await User.findById(session.user.id);
    const allOrders = await Order.find({ customer: session.user.id });

    // If this is customer's first order and they were referred, apply invitee discount
    if (customer.referredBy && allOrders.length === 0 && settings?.inviteeDiscountAmount) {
      firstOrderDiscount = settings.inviteeDiscountAmount;
    }

    // If customer has pending referral bonus, apply it
    if (customer.pendingReferralBonus > 0 && !customer.usedReferralBonus) {
      referralDiscount = customer.pendingReferralBonus;
    }

    const subtotalAfterDiscount = Math.max(0, total - couponDiscount - firstOrderDiscount - referralDiscount);
    const finalTotal = subtotalAfterDiscount; // Shipping charges are NOT included in the total

    if (!Number.isFinite(finalTotal)) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
    }

    const order = new Order({
      customer: session.user.id,
      orderNumber: `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
      products: orderProducts,
      total: finalTotal,
      shipping: { name, email, address, city, postalCode, country, mobile },
      paymentScreenshot,
      transactionId,
      discountCoupon: cleanDiscountCoupon,
      discountAmount: couponDiscount + referralDiscount + firstOrderDiscount,
      discountBreakdown: {
        manualCoupon: manualCouponDiscount,
        referralDiscount,
        firstOrderDiscount,
      },
      shippingCharges: shippingCharges || 0,
      shippingState: shippingState || state,
      status: 'Payment Completed',
    });

    await order.save();

    await createNotification({
      type: 'new-order',
      message: `New order ${order.orderNumber} placed by ${user.name}`,
      userId: null,
      meta: { orderId: order._id.toString(), customerId: session.user.id },
    });

    // Update user if referral bonus was used
    if (customer.pendingReferralBonus > 0 && !customer.usedReferralBonus) {
      await User.findByIdAndUpdate(session.user.id, {
        usedReferralBonus: true,
        pendingReferralBonus: 0
      });
    }

    // If this was first order with referral, give referrer pending bonus
    if (customer.referredBy && allOrders.length === 0 && settings?.referralCouponAmount) {
      await User.findByIdAndUpdate(customer.referredBy, {
        pendingReferralBonus: settings.referralCouponAmount
      });
    }

    // Decrease product quantities
    for (const item of cart) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
    }

    // Mark the reserved offer/bid as redeemed when the coupon is used
    if (cleanDiscountCoupon && coupon && coupon.user && coupon.user.toString() === session.user.id) {
      await Product.updateOne(
        { 'bargainOffers.couponCode': cleanDiscountCoupon, 'bargainOffers.user': session.user.id },
        { $set: { 'bargainOffers.$.reservationUsed': true, 'bargainOffers.$.reservedUntil': undefined } }
      );
      await Product.updateOne(
        { 'bids.couponCode': cleanDiscountCoupon, 'bids.user': session.user.id },
        { $set: { 'bids.$.reservationUsed': true, 'bids.$.reservedUntil': undefined } }
      );
    }

    // Mark coupon as used if one was applied manually
    if (cleanDiscountCoupon) {
      await Coupon.findOneAndUpdate(
        { code: cleanDiscountCoupon },
        { $inc: { usedCount: 1 } }
      );
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    console.error('Order POST error', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
