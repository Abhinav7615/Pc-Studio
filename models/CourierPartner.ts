import mongoose from 'mongoose';

const CourierPartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Delhivery', 'Ekart', 'XpressBees', 'Shadowfax', 'Ecom Express', 'Shiprocket']
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  apiKey: { type: String, required: true },
  apiSecret: { type: String },
  baseUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },

  // Service capabilities
  supportsCOD: { type: Boolean, default: true },
  supportsPrepaid: { type: Boolean, default: true },
  maxWeightKg: { type: Number, default: 30 },
  minWeightKg: { type: Number, default: 0.1 },

  // Pricing (per kg)
  baseRate: { type: Number, required: true }, // Base rate per kg
  additionalRate: { type: Number, default: 0 }, // Additional rate for heavy items
  codChargePercent: { type: Number, default: 0 }, // COD charge as percentage
  fuelSurchargePercent: { type: Number, default: 0 },

  // Service areas and zones
  serviceablePincodes: [{ type: String }],
  zonePricing: {
    type: Map,
    of: {
      baseRate: Number,
      additionalRate: Number,
      estimatedDays: Number
    }
  },

  // Performance metrics
  successRate: { type: Number, default: 95, min: 0, max: 100 },
  averageDeliveryDays: { type: Number, default: 3 },
  rtoRate: { type: Number, default: 5, min: 0, max: 100 }, // Return to origin rate

  // API configuration
  webhookUrl: { type: String },
  webhookSecret: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Note: Pre-save hook removed to avoid TypeScript issues
// CourierPartnerSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

export default mongoose.models.CourierPartner || mongoose.model('CourierPartner', CourierPartnerSchema);