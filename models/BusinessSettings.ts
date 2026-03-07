import mongoose from 'mongoose';

const BusinessSettingsSchema = new mongoose.Schema({
  websiteName: { type: String, default: 'Refurbished PC Studio' },
  whatsapp: { type: String },
  contactEmail: { type: String },
  bankAccountNumber: { type: String },
  upiId: { type: String },
});

export default mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', BusinessSettingsSchema);