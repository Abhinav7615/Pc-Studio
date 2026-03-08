import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
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
      orders = await Order.find({}).populate('customer', 'name email mobile').populate('products.product').sort({ createdAt: -1 });
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
      postalCode,
      country,
      mobile,
      paymentScreenshot,
      transactionId,
      discountCoupon,
      discountAmount = 0,
    } = await request.json();

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is required' }, { status: 400 });
    }

    if (
      !name ||
      !email ||
      !address ||
      !city ||
      !postalCode ||
      !country ||
      !mobile ||
      !paymentScreenshot ||
      !transactionId
    ) {
      return NextResponse.json({ error: 'Please provide all required fields' }, { status: 400 });
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

    total = total - discountAmount;

    const order = new Order({
      customer: session.user.id,
      products: orderProducts,
      total,
      shipping: { name, email, address, city, postalCode, country, mobile },
      paymentScreenshot,
      transactionId,
      discountCoupon,
      discountAmount,
      status: 'Payment Completed',
    });

    await order.save();

    // Decrease product quantities
    for (const item of cart) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Order POST error', error);
    // send back actual message for easier debugging
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
