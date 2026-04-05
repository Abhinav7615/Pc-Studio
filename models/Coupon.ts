import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true }, // e.g., 10 for 10% or 100 for ₹100 off
  expirationDays: { type: Number, default: null }, // null for unlimited
  expirationDate: { type: Date, default: null }, // Calculated and stored for easier querying
  expirationHours: { type: Number, default: null }, // null for unlimited
  startHour: { type: Number, min: 0, max: 23, default: null }, // 0-23
  endHour: { type: Number, min: 0, max: 23, default: null }, // 0-23
  usageLimit: { type: Number, default: null }, // null for unlimited
  usedCount: { type: Number, default: 0 },
  type: { type: String, enum: ['referral', 'admin'], default: 'admin' }, // Type of coupon
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Associated user (for referral coupons)
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Specific products this coupon applies to (empty array means all products)
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);