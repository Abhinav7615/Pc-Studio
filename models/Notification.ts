import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: {
    type: String,
    enum: [
      'order-status',
      'bargain',
      'outbid',
      'auction',
      'admin-message',
      'new-order',
      'cancellation-request',
      'modification-request',
      'user-action',
    ],
    required: true,
  },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  meta: { type: mongoose.Schema.Types.Mixed },
});

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);