import mongoose from 'mongoose';


const VariantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  attributes: { type: Map, of: String }, // e.g. { color: 'Red', size: 'XL' }
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  images: [{ type: String }],
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  images: [{ type: String }],
  categories: { type: [String], default: ['all'] },
  videos: [{ type: String }],
  marketMode: { type: String, enum: ['none', 'bargain', 'auction'], default: 'none' },
  status: { type: String, enum: ['active', 'out-of-stock', 'new', 'archived'], default: 'active' },
  cardType: { type: String, default: '' },
  isTemporarilyUnavailable: { type: Boolean, default: false },
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
  variants: [VariantSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);