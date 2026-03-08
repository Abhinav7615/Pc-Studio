import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
  }],
  total: { type: Number, required: true },
  status: { type: String, enum: ['Payment Pending', 'Payment Verified', 'Payment Rejected', 'Order Preparing', 'Shipped', 'Delivered', 'Order Rejected'], default: 'Payment Pending' },
  returnStatus: { type: String, enum: ['No Return', 'Return Requested', 'Return Approved', 'Return Rejected', 'Return Received', 'Refund Processed'], default: 'No Return' },
  refundStatus: { type: String, enum: ['No Refund', 'Refund Pending', 'Refund Approved', 'Refund Rejected', 'Refund Processed'], default: 'No Refund' },
  returnReason: { type: String },
  shipping: {
    name: String,
    email: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    mobile: String,
  },
  paymentScreenshot: { type: String }, // file path or URL
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);