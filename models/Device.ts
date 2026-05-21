import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  platform: { type: String },
  fcmToken: { type: String, index: true, sparse: true },
  webPushSubscription: { type: mongoose.Schema.Types.Mixed },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Device || mongoose.model('Device', DeviceSchema);
