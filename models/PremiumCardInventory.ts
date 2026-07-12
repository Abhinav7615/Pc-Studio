import mongoose from 'mongoose';

const PremiumCardInventorySchema = new mongoose.Schema({
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true, unique: true },
  availableQuantity: { type: Number, required: true, min: 0, default: 0 },
  soldQuantity: { type: Number, default: 0, min: 0 },
  soldOut: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.CardInventory || mongoose.model('CardInventory', PremiumCardInventorySchema, 'card_inventory');
