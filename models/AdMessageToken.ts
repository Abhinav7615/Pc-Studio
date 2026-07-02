import mongoose from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';

const AdMessageTokenSchema = new mongoose.Schema({
  ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
  token: { type: String, required: true, index: true },
  used: { type: Boolean, default: false },
  uses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

const conn = (mediaConnection as any) || mongoose;
const AdMessageToken = (conn.models && conn.models.AdMessageToken) || conn.model('AdMessageToken', AdMessageTokenSchema);
export default AdMessageToken;
