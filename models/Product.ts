import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  images: [{ type: String }], // array of image URLs or paths
  videos: [{ type: String }], // array of video URLs or paths (max 1 minute)
  bargainEnabled: { type: Boolean, default: false },
  bargainOffers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: { type: String },
      price: { type: Number, required: true },
      status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
      couponCode: { type: String },
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
      reservedUntil: { type: Date },
      reservationUsed: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  biddingEnabled: { type: Boolean, default: false },
  biddingStart: { type: Date },
  biddingEnd: { type: Date },
  bids: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: { type: String },
      price: { type: Number, required: true },
      status: { type: String, enum: ['active', 'rejected', 'winner', 'expired'], default: 'active' },
      couponCode: { type: String },
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
      reservedUntil: { type: Date },
      reservationUsed: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  biddingWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);