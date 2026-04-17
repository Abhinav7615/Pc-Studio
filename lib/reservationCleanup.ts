import Product from '@/models/Product';

export async function releaseExpiredReservations() {
  const now = new Date();
  const products = await Product.find({
    $or: [
      { 'bargainOffers.reservedUntil': { $lte: now } },
      { 'bids.reservedUntil': { $lte: now } },
    ],
  });

  for (const product of products) {
      let changed = false;

      if (product.bargainOffers) {
        for (const offer of product.bargainOffers) {
          if (
            offer.reservedUntil &&
            offer.reservedUntil <= now &&
            !offer.reservationUsed &&
            offer.status === 'accepted'
          ) {
            offer.status = 'expired';
            offer.reservedUntil = undefined;
            changed = true;
          }
        }
      }

      if (product.bids) {
        for (const bid of product.bids) {
          if (
            bid.reservedUntil &&
            bid.reservedUntil <= now &&
            !bid.reservationUsed &&
            bid.status === 'winner'
          ) {
            bid.status = 'expired';
            bid.reservedUntil = undefined;
            changed = true;
          }
        }
      }

      if (changed) {
        await product.save();
      }
    }
}
