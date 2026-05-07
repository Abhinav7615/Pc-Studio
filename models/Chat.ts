import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['support', 'consumer'], default: 'support' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'active', 'closed'], default: 'active' },
  escalated: { type: Boolean, default: false },
  autoJoined: { type: Boolean, default: false },
  requestedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  requestSentAt: { type: Date, default: null },
  requestedAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedAt: { type: Date, default: null },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

ChatSchema.index({ user: 1, status: 1, updatedAt: -1 });
ChatSchema.index({ lastMessageAt: -1 });

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);