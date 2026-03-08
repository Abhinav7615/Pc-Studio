import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';

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

    const { cart, name, email, address, city, postalCode, country, mobile, paymentScreenshot } = await request.json();

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is required' }, { status: 400 });
    }

    if (!name || !email || !address || !city || !postalCode || !country || !mobile || !paymentScreenshot) {
      return NextResponse.json({ error: 'Please provide all required fields' }, { status: 400 });
    }

    let total = 0;
    const orderProducts = [];

    for (const item of cart) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
      }
      const price = product.originalPrice * (1 - product.discountPercent / 100);
      total += price * item.quantity;
      orderProducts.push({ product: item.productId, quantity: item.quantity });
    }

    const order = new Order({
      customer: session.user.id,
      products: orderProducts,
      total,
      shipping: { name, email, address, city, postalCode, country, mobile },
      paymentScreenshot,
    });

    await order.save();

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
