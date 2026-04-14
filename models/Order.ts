import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
  },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
  }],
  total: { type: Number, required: true },
  // added PAYMENT_COMPLETED value previously, ensure schema always reflects latest enum
  status: {
    type: String,
    enum: [
      'Payment Pending',
      'Payment Completed',
      'Payment Verified',
      'Payment Rejected',
      'Order Preparing',
      'Shipped',
      'Delivered',
      'Order Rejected',
    ],
    default: 'Payment Pending',
  },
  returnStatus: {
    type: String,
    enum: [
      'No Return',
      'Return Requested',
      'Return Approved',
      'Return Rejected',
      'Return Received',
      'Refund Processed',
    ],
    default: 'No Return',
  },
  refundStatus: {
    type: String,
    enum: [
      'No Refund',
      'Refund Pending',
      'Refund Approved',
      'Refund Rejected',
      'Refund Processed',
    ],
    default: 'No Refund',
  },
  returnReason: { type: String },
  returnDeadline: { type: Date },
  deliveryDate: { type: Date },
  deliveryCompanyName: { type: String },
  deliveryCompanyDetails: { type: String },
  trackingId: { type: String },
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
  cancellationStatus: {
    type: String,
    enum: ['None', 'Cancellation Requested', 'Cancellation Approved', 'Cancellation Rejected'],
    default: 'None',
  },
  cancellationReason: { type: String },
  modificationRequest: {
    status: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected'], default: 'None' },
    reason: { type: String },
  },
  discountCoupon: { type: String },
  discountAmount: { type: Number, default: 0 },
  discountBreakdown: {
    manualCoupon: { type: Number, default: 0 },
    referralDiscount: { type: Number, default: 0 },
    firstOrderDiscount: { type: Number, default: 0 },
  },
  shippingCharges: { type: Number, default: 0 },
  shippingState: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// always drop existing model so enum updates are applied on hot-reload/dev server
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}
export default mongoose.model('Order', OrderSchema);