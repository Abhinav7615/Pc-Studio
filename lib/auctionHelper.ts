import BusinessSettings from '@/models/BusinessSettings';
import Coupon from '@/models/Coupon';
import { generateCouponCode } from '@/lib/referral';

export async function resolveEndedAuction(product: any) {
  const now = new Date();
  if (!product || !product.biddingEnabled || !product.biddingEnd || product.biddingEnd > now) {
    return;
  }

  const activeBids = product.bids?.filter((bid: any) => bid.status === 'active') || [];
  const existingWinner = product.bids?.find((bid: any) => bid.status === 'winner');
  let shouldSave = false;

  if (existingWinner) {
    product.bids.forEach((bid: any) => {
      if (bid.status === 'active') {
        bid.status = 'rejected';
        shouldSave = true;
      }
    });

    if (!product.biddingWinner) {
      product.biddingWinner = existingWinner.user;
      shouldSave = true;
    }

    if (!existingWinner.couponCode && !existingWinner.reservedUntil && !existingWinner.reservationUsed) {
      const settings = await BusinessSettings.findOne();
      const validityDays = settings?.biddingCouponDays ?? 2;
      const discountValue = Math.max(0, (product.originalPrice || 0) - existingWinner.price);
      const couponCode = generateCouponCode();
      const coupon = new Coupon({
        code: couponCode,
        discountType: 'fixed',
        discountValue,
        targetPrice: existingWinner.price,
        expirationDays: validityDays,
        usageLimit: 1,
        type: 'bidding',
        user: existingWinner.user,
        products: [product._id],
      });

      await coupon.save();
      existingWinner.couponCode = coupon.code;
      existingWinner.couponId = coupon._id;
      existingWinner.reservedUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
      shouldSave = true;
    }

    if (shouldSave) {
      await product.save();
    }

    return;
  }

  if (!activeBids.length) {
    return;
  }

  const winner = activeBids.sort((a: any, b: any) => {
    if ((b.price || 0) !== (a.price || 0)) {
      return (b.price || 0) - (a.price || 0);
    }
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return aDate - bDate;
  })[0];

  product.bids.forEach((bid: any) => {
    if (bid._id?.toString() === winner._id?.toString()) {
      bid.status = 'winner';
    } else if (bid.status === 'active') {
      bid.status = 'rejected';
    }
  });

  if (!winner.couponCode && !winner.reservedUntil && !winner.reservationUsed) {
    const settings = await BusinessSettings.findOne();
    const validityDays = settings?.biddingCouponDays ?? 2;
    const discountValue = Math.max(0, (product.originalPrice || 0) - winner.price);
    const couponCode = generateCouponCode();
    const coupon = new Coupon({
      code: couponCode,
      discountType: 'fixed',
      discountValue,
      targetPrice: winner.price,
      expirationDays: validityDays,
      usageLimit: 1,
      type: 'bidding',
      user: winner.user,
      products: [product._id],
    });

    await coupon.save();
    winner.couponCode = coupon.code;
    winner.couponId = coupon._id;
    winner.reservedUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
  }

  product.biddingWinner = winner.user;
  await product.save();
}
