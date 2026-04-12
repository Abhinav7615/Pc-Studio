import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { resolveEndedAuction } from '@/lib/auctionHelper';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const products = await Product.find({
      $or: [
        { 'bargainOffers.user': session.user.id },
        { 'bids.user': session.user.id },
      ],
    }).select('name images bargainOffers bids');

    const offers: Array<any> = [];
    const bids: Array<any> = [];
    const now = new Date();

    for (const product of products) {
      await resolveEndedAuction(product);
      product.bargainOffers?.forEach((offer: any) => {
        if (offer.user?.toString() === session.user.id) {
          offers.push({
            productId: product._id,
            productName: product.name,
            productImage: product.images?.[0] || '',
            price: offer.price,
            status: offer.status,
            couponCode: offer.couponCode,
            reservedUntil: offer.reservedUntil,
            reservationExpired: offer.reservedUntil ? offer.reservedUntil <= now : false,
            createdAt: offer.createdAt,
            type: 'bargain',
          });
        }
      });
      product.bids?.forEach((bid: any) => {
        if (bid.user?.toString() === session.user.id) {
          bids.push({
            productId: product._id,
            productName: product.name,
            productImage: product.images?.[0] || '',
            price: bid.price,
            status: bid.status,
            couponCode: bid.couponCode,
            reservedUntil: bid.reservedUntil,
            reservationExpired: bid.reservedUntil ? bid.reservedUntil <= now : false,
            createdAt: bid.createdAt,
            type: 'bidding',
          });
        }
      });
    }

    return NextResponse.json({ offers, bids }, { status: 200 });
  } catch (error) {
    console.error('Error fetching market activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
