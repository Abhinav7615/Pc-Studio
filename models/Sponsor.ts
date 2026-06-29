import mongoose, { Schema, Document } from 'mongoose';

export interface ISponsor extends Document {
  // Company Information
  companyName: string;
  advertiserName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;

  // Media
  logo?: string; // URL or media ID
  banner?: string; // URL or media ID
  video?: string; // URL or media ID
  html?: string; // Custom HTML ad
  javascript?: string; // Custom JS ad

  // Campaign Details
  landingUrl?: string;
  adZones: string[]; // Array of zone keys
  startDate: Date;
  endDate: Date;

  // Billing
  amount: number;
  invoiceNumber?: string;
  paymentStatus: 'pending' | 'partial' | 'completed' | 'refunded';
  paidAmount: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';

  // Frequency
  impressionLimit?: number;
  clickLimit?: number;
  dailyBudget?: number;
  frequencyCap?: number;

  // Ad Configuration
  adType: 'html' | 'banner' | 'video' | 'native' | 'custom';
  adTitle?: string;
  adDescription?: string;
  priority: number;
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'expired' | 'rejected';

  // Tracking & Analytics
  impressions: number;
  clicks: number;
  conversions?: number;
  contractUrl?: string; // PDF contract

  // Admin Notes
  notes?: string;
  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const sponsorSchema = new Schema<ISponsor>(
  {
    companyName: { type: String, required: true },
    advertiserName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    whatsapp: String,
    website: String,

    logo: String,
    banner: String,
    video: String,
    html: String,
    javascript: String,

    landingUrl: String,
    adZones: [String],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    amount: { type: Number, required: true },
    invoiceNumber: String,
    paymentStatus: { type: String, enum: ['pending', 'partial', 'completed', 'refunded'], default: 'pending' },
    paidAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'custom'], default: 'custom' },

    impressionLimit: Number,
    clickLimit: Number,
    dailyBudget: Number,
    frequencyCap: Number,

    adType: { type: String, enum: ['html', 'banner', 'video', 'native', 'custom'], default: 'banner' },
    adTitle: String,
    adDescription: String,
    priority: { type: Number, default: 10 },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'active', 'paused', 'expired', 'rejected'],
      default: 'draft',
    },

    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: Number,
    contractUrl: String,

    notes: String,
    rejectionReason: String,
    approvedBy: mongoose.Schema.Types.ObjectId,
    approvedAt: Date,
  },
  { timestamps: true }
);

// Index for common queries
sponsorSchema.index({ status: 1, startDate: 1, endDate: 1 });
sponsorSchema.index({ email: 1 });
sponsorSchema.index({ adZones: 1 });
sponsorSchema.index({ createdAt: -1 });

export default mongoose.models.Sponsor || mongoose.model<ISponsor>('Sponsor', sponsorSchema);
