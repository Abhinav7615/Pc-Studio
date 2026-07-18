import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { resolveEndedAuction } from '@/lib/auctionHelper';
import { createNotificationAndPush } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const isAdminRequest = session?.user?.role === 'admin' || session?.user?.role === 'staff';

    const products = await Product.find({}).sort({ createdAt: -1 });
    await Promise.all(products.map((product: any) => resolveEndedAuction(product)));

    const responseProducts = products.map((product: any) => {
      const result = product.toObject ? product.toObject() : { ...product };
      if (result.isTemporarilyUnavailable && !isAdminRequest) {
        result.quantity = 0;
      }
      return result;
    });

    return NextResponse.json(responseProducts, { status: 200 });
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

    const { name, description, originalPrice, discountPercent, gstPercent, quantity, images, videos, marketMode, status, biddingStart, biddingEnd, categories, variants, cardType, isTemporarilyUnavailable } = await request.json();
    const normalizedDiscountPercent = Number(discountPercent) || 0;
    const normalizedGstPercent = Number(gstPercent) || 0;

    if (!name || !description || !originalPrice) {
      return NextResponse.json({ error: 'Name, description, and original price are required' }, { status: 400 });
    }

    const parsedQuantity = quantity !== undefined && quantity !== null ? Number(quantity) : 0;
    console.log('Creating product with quantity:', parsedQuantity, 'from input:', quantity);

    const mode = marketMode === 'auction' ? 'auction' : marketMode === 'bargain' ? 'bargain' : 'none';
    const product = new Product({
      name,
      description,
      originalPrice,
      discountPercent: normalizedDiscountPercent,
      gstPercent: normalizedGstPercent,
      quantity: parsedQuantity,
      categories: Array.isArray(categories) && categories.length > 0 ? categories : ['all'],
      images: images || [],
      videos: videos || [],
      marketMode: mode,
      status: ['active', 'out-of-stock', 'new', 'archived'].includes(status) ? status : 'active',
      cardType: cardType || '',
      isTemporarilyUnavailable: Boolean(isTemporarilyUnavailable),
      bargainEnabled: mode === 'bargain',
      biddingEnabled: mode === 'auction',
      biddingStart: biddingStart ? new Date(biddingStart) : undefined,
      biddingEnd: biddingEnd ? new Date(biddingEnd) : undefined,
      variants: Array.isArray(variants) ? variants : [],
    });

    await product.save();
    await createNotificationAndPush({
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
