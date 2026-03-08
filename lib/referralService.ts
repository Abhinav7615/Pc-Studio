import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import BusinessSettings from '@/models/BusinessSettings';
import Order from '@/models/Order';
import { generateCouponCode } from '@/lib/referral';

export async function processReferralCoupons(customerId: string) {
  try {
    await dbConnect();

    // Find the customer
    const customer = await User.findById(customerId).populate('referredBy');
    if (!customer || !customer.referredBy) {
      return; // No referral, nothing to do
    }

    // Check if this customer has made any previous orders
    const previousOrders = await Order.find({ customer: customerId });
    if (previousOrders.length > 1) {
      return; // Not the first order, no referral bonus
    }

    // Get business settings for referral amounts
    const settings = await BusinessSettings.findOne({});
    if (!settings || !settings.referralEnabled) {
      return; // Referrals not enabled
    }

    // Generate coupon for referrer (the one who invited)
    const referrerCouponCode = generateCouponCode();
    const referrerCoupon = new Coupon({
      code: referrerCouponCode,
      discountType: 'fixed',
      discountValue: settings.referralCouponAmount,
      expirationDays: 30, // 30 days validity
      usageLimit: 1, // One time use
      user: customer.referredBy, // Associate with referrer
    });
    await referrerCoupon.save();

    // Generate coupon for invitee (the new customer)
    const inviteeCouponCode = generateCouponCode();
    const inviteeCoupon = new Coupon({
      code: inviteeCouponCode,
      discountType: 'fixed',
      discountValue: settings.inviteeDiscountAmount,
      expirationDays: 30, // 30 days validity
      usageLimit: 1, // One time use
      user: customerId, // Associate with invitee
    });
    await inviteeCoupon.save();

    // Note: In a real application, you might want to send emails to both users
    // with their coupon codes. For now, we'll just create the coupons.

    console.log(`Referral coupons generated: ${referrerCouponCode} for referrer, ${inviteeCouponCode} for invitee`);

  } catch (error) {
    console.error('Error processing referral coupons:', error);
  }
}