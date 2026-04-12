import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import { generateCouponCode } from '@/lib/referral';
import { resolveEndedAuction } from '@/lib/auctionHelper';

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

    await resolveEndedAuction(product);

    return NextResponse.json({ bids: product.bids || [], biddingWinner: product.biddingWinner }, { status: 200 });
  } catch (error) {
    console.error('GET /api/products/[id]/bids error:', error);
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
    const bidAmount = Number(body.price);

    if (!bidAmount || bidAmount <= 0) {
      return NextResponse.json({ error: 'Enter a valid bid amount' }, { status: 400 });
    }

    const settings = await BusinessSettings.findOne();
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (!product.biddingEnabled || !settings?.biddingEnabled) {
      return NextResponse.json({ error: 'Bidding is not enabled for this product' }, { status: 400 });
    }

    const alreadyBid = product.bids?.some((bid: any) => bid.user?.toString() === session.user.id);
    const alreadyOffered = product.bargainOffers?.some((offer: any) => offer.user?.toString() === session.user.id);
    if (alreadyBid || alreadyOffered) {
      return NextResponse.json({ error: 'You have already submitted a bid or offer for this product' }, { status: 400 });
    }

    const now = new Date();
    if (product.biddingStart && now < product.biddingStart) {
      return NextResponse.json({ error: 'Auction has not started yet' }, { status: 400 });
    }
    if (product.biddingEnd && now > product.biddingEnd) {
      return NextResponse.json({ error: 'Auction has already ended' }, { status: 400 });
    }

    const currentHighest = product.bids?.reduce((max: number, bid: any) => Math.max(max, bid.price || 0), 0) || 0;
    if (bidAmount <= currentHighest) {
      return NextResponse.json({ error: `Your bid must be higher than the current highest bid of ₹${currentHighest}` }, { status: 400 });
    }

    product.bids = product.bids || [];
    product.bids.push({
      user: session.user.id,
      email: session.user.email || '',
      price: bidAmount,
      status: 'active',
      createdAt: new Date(),
    });

    await product.save();

    return NextResponse.json({ message: 'Bid placed', bid: product.bids.at(-1) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products/[id]/bids error:', error);
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
    const { bidId, action } = body;
    if (!bidId || !['reject', 'winner'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const bid = product.bids?.find((item: any) => item._id?.toString() === String(bidId));
    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    if (action === 'winner') {
      const settings = await BusinessSettings.findOne();
      const validityDays = settings?.biddingCouponDays ?? 2;

      if (bid.status !== 'winner') {
        bid.status = 'winner';
      }

      product.bids.forEach((item: any) => {
        if (item._id?.toString() === String(bidId)) {
          item.status = 'winner';
        } else if (item.status === 'active') {
          item.status = 'rejected';
        }
      });

      if (!bid.reservedUntil && !bid.reservationUsed) {
        if (product.quantity <= 0) {
          return NextResponse.json({ error: 'Cannot reserve stock for this product at the moment' }, { status: 400 });
        }

        const discountValue = Math.max(0, (product.originalPrice || 0) - bid.price);
        const couponCode = generateCouponCode();
        const coupon = new Coupon({
          code: couponCode,
          discountType: 'fixed',
          discountValue,
          targetPrice: bid.price,
          expirationDays: validityDays,
          usageLimit: 1,
          type: 'bidding',
          user: bid.user,
          products: [product._id],
        });

        await coupon.save();
        bid.couponCode = coupon.code;
        bid.couponId = coupon._id;
        bid.reservedUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
      }

      product.biddingWinner = bid.user;
    } else {
      if (bid.status === 'winner' && bid.reservedUntil && !bid.reservationUsed) {
        product.quantity = Math.max(0, product.quantity + 1);
        bid.reservedUntil = undefined;
      }
      bid.status = 'rejected';
    }

    await product.save();

    return NextResponse.json({ message: 'Bid action completed', bids: product.bids, biddingWinner: product.biddingWinner }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/products/[id]/bids error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
