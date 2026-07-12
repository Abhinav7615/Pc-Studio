import mongoose from 'mongoose';

const PremiumCardPaymentSettingsSchema = new mongoose.Schema({
  qrImage: { type: String, default: '' },
  upiId: { type: String, default: '' },
  merchantName: { type: String, default: 'Pc Studio' },
  accountNumber: { type: String, default: '' },
  ifsc: { type: String, default: '' },
  bankName: { type: String, default: '' },
  walletAddress: { type: String, default: '' },
  paymentInstructions: { type: String, default: '' },
  countdownTimer: { type: Number, default: 900 },
  minimumAmount: { type: Number, default: 100 },
  maximumAmount: { type: Number, default: 50000 },
  maintenanceMode: { type: Boolean, default: false },
  enableQr: { type: Boolean, default: true },
  enableUpi: { type: Boolean, default: true },
  enableBankTransfer: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.PaymentSetting || mongoose.model('PaymentSetting', PremiumCardPaymentSettingsSchema, 'payment_settings');
