import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  escalated: { type: Boolean, default: false },
  joinedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedAt: { type: Date, default: null },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

ChatSchema.index({ user: 1, status: 1, updatedAt: -1 });
ChatSchema.index({ lastMessageAt: -1 });

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);