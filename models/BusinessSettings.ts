import mongoose from 'mongoose';

const BusinessSettingsSchema = new mongoose.Schema({
  websiteName: { type: String, default: 'Refurbished PC Studio' },
  whatsapp: { type: String },
  contactEmail: { type: String },
  bankAccountNumber: { type: String },
  upiId: { type: String },
  offlineShopAddress: { type: String },
  offlineShopCity: { type: String },
  offlineShopState: { type: String },
  offlineShopPincode: { type: String },
  offlineShopEnabled: { type: Boolean, default: false },
  // Referral settings
  referralEnabled: { type: Boolean, default: true },
  referralCouponAmount: { type: Number, default: 100 }, // Amount for referrer's coupon
  referralCouponDays: { type: Number, default: 30 }, // Validity in days
  referralCouponUsageLimit: { type: Number, default: 1 }, // How many times it can be used
  inviteeDiscountAmount: { type: Number, default: 50 }, // Amount for invitee's coupon
  inviteeDiscountDays: { type: Number, default: 30 }, // Validity in days
  inviteeDiscountUsageLimit: { type: Number, default: 1 }, // How many times it can be used
});

export default mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', BusinessSettingsSchema);