import mongoose from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';

const AdViewSchema = new mongoose.Schema({
  ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visitorId: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const conn = (mediaConnection as any) || mongoose;
const AdView = (conn.models && conn.models.AdView) || conn.model('AdView', AdViewSchema);
export default AdView;
