import mongoose from 'mongoose';

const PremiumCardSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'CardCategory', required: true },
  categoryName: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  network: { type: String, required: true, trim: true },
  balance: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  holderName: { type: String, default: '' },
  cardNumber: { type: String, default: '' },
  expiry: { type: String, default: '' },
  cvv: { type: String, default: '' },
  zip: { type: String, default: '' },
  billingAddress: { type: String, default: '' },
  country: { type: String, default: '' },
  bank: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  featured: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  image: { type: String, default: '' },
  soldOut: { type: Boolean, default: false },
  isTemporarilyUnavailable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Card || mongoose.model('Card', PremiumCardSchema, 'cards');
