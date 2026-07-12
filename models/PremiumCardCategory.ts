import mongoose from 'mongoose';

const PremiumCardCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.CardCategory || mongoose.model('CardCategory', PremiumCardCategorySchema, 'card_categories');
