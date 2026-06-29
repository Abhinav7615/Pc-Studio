import mongoose from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';

const ProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  description: { type: String },
  type: { type: String },
  allowJs: { type: Boolean, default: false },
  status: { type: String, enum: ['enabled','disabled'], default: 'enabled' },
  priority: { type: Number, default: 0 },
  javascript: { type: String },
  html: { type: String },
  css: { type: String },
  // timestamps for provider records
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  apiConfig: { type: mongoose.Schema.Types.Mixed },
  secretKeys: { type: mongoose.Schema.Types.Mixed },
  notes: { type: String },
});

ProviderSchema.pre('save', function () {
  if (this instanceof mongoose.Document) {
    this.updatedAt = new Date();
  }
});

const conn = (mediaConnection as any) || mongoose;
const Provider = (conn.models && conn.models.Provider) || conn.model('Provider', ProviderSchema);
export default Provider;
