import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
  reply: { type: String, trim: true, maxlength: 1000 },
  replyAt: { type: Date },
  replyBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);