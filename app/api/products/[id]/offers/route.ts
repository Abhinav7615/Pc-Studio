import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import { generateCouponCode } from '@/lib/referral';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ bargainOffers: product.bargainOffers || [] }, { status: 200 });
  } catch (error) {
    console.error('GET /api/products/[id]/offers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const price = Number(body.price);

    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Enter a valid offer price' }, { status: 400 });
    }

    const settings = await BusinessSettings.findOne();
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (!product.bargainEnabled || !settings?.bargainEnabled) {
      return NextResponse.json({ error: 'Bargain offers are not enabled for this product' }, { status: 400 });
    }

    const alreadyOffered = product.bargainOffers?.some((offer: any) => offer.user?.toString() === session.user.id);
    const alreadyBid = product.bids?.some((bid: any) => bid.user?.toString() === session.user.id);
    if (alreadyOffered || alreadyBid) {
      return NextResponse.json({ error: 'You have already submitted an offer or bid for this product' }, { status: 400 });
    }

    product.bargainOffers = product.bargainOffers || [];
    product.bargainOffers.push({
      user: session.user.id,
      email: session.user.email || '',
      price,
      status: 'pending',
      createdAt: new Date(),
    });

    await product.save();

    return NextResponse.json({ message: 'Offer submitted', offer: product.bargainOffers.at(-1) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products/[id]/offers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { offerId, action } = body;
    if (!offerId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const offer = product.bargainOffers?.find((item: any) => item._id?.toString() === String(offerId));
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (action === 'accept') {
      const settings = await BusinessSettings.findOne();
      const validityDays = settings?.bargainCouponDays ?? 3;

      if (offer.status !== 'accepted') {
        offer.status = 'accepted';
      }

      if (!offer.reservedUntil && !offer.reservationUsed) {
        if (product.quantity <= 0) {
          return NextResponse.json({ error: 'Cannot reserve stock for this product at the moment' }, { status: 400 });
        }

        const discountValue = Math.max(0, (product.originalPrice || 0) - offer.price);
        const couponCode = generateCouponCode();
        const coupon = new Coupon({
          code: couponCode,
          discountType: 'fixed',
          discountValue,
          targetPrice: offer.price,
          expirationDays: validityDays,
          usageLimit: 1,
          type: 'bargain',
          user: offer.user,
          products: [product._id],
        });

        await coupon.save();
        offer.couponCode = coupon.code;
        offer.couponId = coupon._id;
        offer.reservedUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
      }
    } else {
      if (offer.status === 'accepted' && offer.reservedUntil && !offer.reservationUsed) {
        product.quantity = Math.max(0, product.quantity + 1);
        offer.reservedUntil = undefined;
      }
      offer.status = 'rejected';
    }

    await product.save();

    await createNotification({
      userId: offer.user?.toString() || null,
      type: offer.status === 'accepted' ? 'bargain' : 'bargain',
      message: offer.status === 'accepted'
        ? `Your bargain offer for ${product.name} was accepted.`
        : `Your bargain offer for ${product.name} was rejected.`,
      meta: {
        productId: product._id.toString(),
        offerId: offer._id?.toString(),
      },
    });

    return NextResponse.json({ message: 'Offer updated', offer, bargainOffers: product.bargainOffers }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/products/[id]/offers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
