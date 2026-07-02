import mongoose from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';

const ProviderAuditSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  action: { type: String, enum: ['create','update','delete'], required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const conn = (mediaConnection as any) || mongoose;
const ProviderAudit = (conn.models && conn.models.ProviderAudit) || conn.model('ProviderAudit', ProviderAuditSchema);
export default ProviderAudit;
