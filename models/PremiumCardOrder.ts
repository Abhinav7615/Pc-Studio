import mongoose from 'mongoose';

const PremiumCardOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  cardName: { type: String, default: '' },
  categoryName: { type: String, default: '' },
  price: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  paymentScreenshot: { type: String, default: '' },
  utrNumber: { type: String, default: '' },
  transactionId: { type: String, default: '' },
  remark: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'released'], default: 'pending' },
  cardDetails: { type: Object, default: null },
  adminNote: { type: String, default: '' },
  viewedAt: { type: Date, default: null },
  approvedAt: { type: Date, default: null },
  releasedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.CardOrder || mongoose.model('CardOrder', PremiumCardOrderSchema, 'card_orders');
