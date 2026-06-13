import mongoose from 'mongoose';

const TelegramSessionSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, index: true },
  chatId: { type: Number, required: true },
  state: { type: String, required: true, default: 'idle' },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

(TelegramSessionSchema as any).pre('save', function (this: any, next: any) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.TelegramSession || mongoose.model('TelegramSession', TelegramSessionSchema);
