import mongoose from 'mongoose';

const PremiumCardModuleSettingsSchema = new mongoose.Schema({
  shopSectionEnabled: { type: Boolean, default: true },
  adminSectionEnabled: { type: Boolean, default: true },
  title: { type: String, default: 'Premium Virtual Cards' },
  description: { type: String, default: 'Buy premium virtual cards with secure checkout and admin verification.' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.PremiumCardModuleSettings || mongoose.model('PremiumCardModuleSettings', PremiumCardModuleSettingsSchema, 'premium_card_module_settings');
