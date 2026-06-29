import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, required: true },
  sponsor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sponsorName: { type: String },
  sponsorEmail: { type: String },
  sponsorPhone: { type: String },
  ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad' },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  description: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['draft','pending','paid','cancelled'], default: 'pending' },
  cfOrderId: { type: String },
  paymentSessionId: { type: String },
  transactionId: { type: String },
  dueDate: { type: Date },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

InvoiceSchema.pre('save', function () {
  if (this instanceof mongoose.Document) {
    this.updatedAt = new Date();
  }
});

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
