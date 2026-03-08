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
});

export default mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', BusinessSettingsSchema);