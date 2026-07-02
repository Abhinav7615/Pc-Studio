import mongoose from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';

const TargetingSchema = new mongoose.Schema({
  countries: { type: [String], default: [] },
  states: { type: [String], default: [] },
  cities: { type: [String], default: [] },
  devices: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  loggedInOnly: { type: Boolean, default: false },
}, { _id: false });

const AdSchema = new mongoose.Schema({
  title: { type: String },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  providerName: { type: String },
  providerType: { type: String },
  zone: { type: String, required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  type: { type: String, enum: ['html','js','image','video','iframe','native'], default: 'html' },
  html: { type: String },
  js: { type: String },
  css: { type: String },
  image: { type: String },
  video: { type: String },
  iframeSrc: { type: String },
  nativePayload: { type: mongoose.Schema.Types.Mixed },
  targetUrl: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['draft','active','disabled','expired'], default: 'draft' },
  priority: { type: Number, default: 0 },
  weight: { type: Number, default: 1 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  lastImpressionAt: { type: Date },
  lastClickAt: { type: Date },
  frequencyCap: { type: Number, default: 0 },
  cooldownSeconds: { type: Number, default: 0 },
  rotationStrategy: { type: String, enum: ['random','weighted','round_robin','sequential'], default: 'weighted' },
  targeting: { type: TargetingSchema, default: () => ({}) },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AdSchema.pre('save', function () {
  // Update timestamps
  if (this instanceof mongoose.Document) {
    this.updatedAt = new Date();
  }
});

const conn = (mediaConnection as any) || mongoose;
const Ad = (conn.models && conn.models.Ad) || conn.model('Ad', AdSchema);
export default Ad;
