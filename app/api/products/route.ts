import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { resolveEndedAuction } from '@/lib/auctionHelper';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  try {
    await dbConnect();

    const products = await Product.find({}).sort({ createdAt: -1 });
    await Promise.all(products.map((product: any) => resolveEndedAuction(product)));

    return NextResponse.json(products, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, description, originalPrice, discountPercent, gstPercent, quantity, images, videos, bargainEnabled, biddingEnabled, biddingStart, biddingEnd } = await request.json();
    const normalizedDiscountPercent = Number(discountPercent) || 0;
    const normalizedGstPercent = Number(gstPercent) || 0;

    if (!name || !description || !originalPrice) {
      return NextResponse.json({ error: 'Name, description, and original price are required' }, { status: 400 });
    }

    const parsedQuantity = quantity !== undefined && quantity !== null ? Number(quantity) : 0;
    console.log('Creating product with quantity:', parsedQuantity, 'from input:', quantity);

    const product = new Product({
      name,
      description,
      originalPrice,
      discountPercent: normalizedDiscountPercent,
      gstPercent: normalizedGstPercent,
      quantity: parsedQuantity,
      images: images || [],
      videos: videos || [],
      bargainEnabled: bargainEnabled === true || bargainEnabled === 'true',
      biddingEnabled: biddingEnabled === true || biddingEnabled === 'true',
      biddingStart: biddingStart ? new Date(biddingStart) : undefined,
      biddingEnd: biddingEnd ? new Date(biddingEnd) : undefined,
    });

    await product.save();
    await createNotification({
      type: 'admin-message',
      userId: null,
      message: `New product added: ${product.name}. Check it out now!`,
      meta: { productId: product._id.toString() },
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
