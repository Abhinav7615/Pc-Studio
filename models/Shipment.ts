import mongoose from 'mongoose';

const ShipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderNumber: { type: String, required: true },

  // Courier details
  courierPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'CourierPartner', required: true },
  courierName: { type: String, required: true },
  courierCode: { type: String, required: true },

  // Shipment details
  awbNumber: { type: String, required: true, unique: true },
  shipmentId: { type: String }, // Courier's internal shipment ID
  trackingUrl: { type: String },

  // Package details
  weight: { type: Number, required: true }, // in kg
  length: { type: Number }, // in cm
  breadth: { type: Number }, // in cm
  height: { type: Number }, // in cm
  volumetricWeight: { type: Number }, // calculated weight

  // Pricing
  shippingCost: { type: Number, required: true },
  codAmount: { type: Number, default: 0 },
  isCOD: { type: Boolean, default: false },

  // Addresses
  pickupAddress: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    email: String
  },
  deliveryAddress: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    email: String
  },

  // Status tracking
  status: {
    type: String,
    enum: [
      'Shipment Created',
      'Pickup Scheduled',
      'Pickup Done',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Failed Delivery',
      'Returned',
      'Lost',
      'Cancelled'
    ],
    default: 'Shipment Created'
  },

  // Status history
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    location: String,
    remarks: String,
    updatedBy: String
  }],

  // Courier response data
  courierResponse: { type: mongoose.Schema.Types.Mixed },

  // Documents
  labelUrl: { type: String },
  manifestUrl: { type: String },
  invoiceUrl: { type: String },

  // Estimated delivery
  estimatedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },

  // Additional charges
  additionalCharges: {
    fuelSurcharge: { type: Number, default: 0 },
    codCharges: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Performance metrics
  pickupAttempts: { type: Number, default: 0 },
  deliveryAttempts: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Note: Pre-save hook removed to avoid TypeScript issues
// ShipmentSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// Index for efficient queries
ShipmentSchema.index({ order: 1 });
ShipmentSchema.index({ awbNumber: 1 });
ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ courierPartner: 1 });
ShipmentSchema.index({ 'deliveryAddress.pincode': 1 });

export default mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);