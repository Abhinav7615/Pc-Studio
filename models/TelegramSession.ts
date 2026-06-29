import mongoose from 'mongoose';

const TelegramSessionSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, index: true },
  chatId: { type: Number, required: true },
  state: { type: String, required: true, default: 'idle' },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TelegramSessionSchema.pre('save', function () {
  if (this instanceof mongoose.Document) {
    this.updatedAt = new Date();
  }
});

export default mongoose.models.TelegramSession || mongoose.model('TelegramSession', TelegramSessionSchema);
