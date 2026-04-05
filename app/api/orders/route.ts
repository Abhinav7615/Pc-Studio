import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import BusinessSettings from '@/models/BusinessSettings';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let orders;

    if (session.user.role === 'customer') {
      orders = await Order.find({ customer: session.user.id }).populate('products.product').sort({ createdAt: -1 });
    } else if (session.user.role === 'admin' || session.user.role === 'staff') {
      orders = await Order.find({}).populate('customer', 'name email mobile customerId').populate('products.product').sort({ createdAt: -1 });
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(orders, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

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
      discountAmount = 0,
      shippingCharges = 0,
      shippingState,
    } = await request.json();

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

    let total = 0;
    const orderProducts: Array<{ product: string; quantity: number }> = [];

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
      total += price * item.quantity;
      orderProducts.push({ product: item.productId, quantity: item.quantity });
    }

    // Get business settings for referral amounts
    const settings = await BusinessSettings.findOne({});
    let appliedDiscount = discountAmount || 0;

    // Discount breakdown for tracking
    let manualCouponDiscount = discountAmount || 0;
    let referralDiscount = 0;
    let firstOrderDiscount = 0;

    // Check for referral bonuses
    const customer = await User.findById(session.user.id);
    const allOrders = await Order.find({ customer: session.user.id });

    // If this is customer's first order and they were referred, apply invitee discount
    if (customer.referredBy && allOrders.length === 0 && settings?.inviteeDiscountAmount) {
      firstOrderDiscount = settings.inviteeDiscountAmount;
      appliedDiscount += firstOrderDiscount;
    }

    // If customer has pending referral bonus, apply it
    if (customer.pendingReferralBonus > 0 && !customer.usedReferralBonus) {
      referralDiscount = customer.pendingReferralBonus;
      appliedDiscount += referralDiscount;
    }

    const subtotalAfterDiscount = Math.max(0, total - appliedDiscount);
    const finalTotal = subtotalAfterDiscount + (shippingCharges || 0);

    const order = new Order({
      customer: session.user.id,
      products: orderProducts,
      total: finalTotal,
      shipping: { name, email, address, city, postalCode, country, mobile },
      paymentScreenshot,
      transactionId,
      discountCoupon,
      discountAmount: appliedDiscount,
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

    // Mark coupon as used if one was applied manually
    if (discountCoupon) {
      await Coupon.findOneAndUpdate(
        { code: discountCoupon.toUpperCase() },
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
