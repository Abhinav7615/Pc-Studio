import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Content || mongoose.model('Content', ContentSchema);