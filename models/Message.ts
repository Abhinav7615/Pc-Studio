import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: String, enum: ['user', 'admin', 'bot'], required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

MessageSchema.index({ chat: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);