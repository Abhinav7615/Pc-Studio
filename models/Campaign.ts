import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  zone: { type: String },
  priority: { type: Number, default: 0 },
  weight: { type: Number, default: 1 },
  status: { type: String, enum: ['draft','active','paused','expired'], default: 'draft' },
  targetUrl: { type: String },
  targeting: { type: mongoose.Schema.Types.Mixed },
  schedule: { type: mongoose.Schema.Types.Mixed },
  budget: { type: Number, default: 0 },
  dailyBudget: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  clickLimit: { type: Number },
  impressionLimit: { type: Number },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CampaignSchema.pre('save', function () {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.updatedAt = new Date();
});

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
