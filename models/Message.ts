import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: String, enum: ['user', 'admin', 'bot'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  senderName: { type: String, default: '' },
  type: { type: String, enum: ['text', 'audio', 'image'], default: 'text' },
  content: { type: String, required: true, trim: true, maxlength: 10485760, alias: 'message' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // For duration, size, etc.
  delivered: { type: Boolean, default: false },
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

MessageSchema.index({ chat: 1, createdAt: 1 });
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);