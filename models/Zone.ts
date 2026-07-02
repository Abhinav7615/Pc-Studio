import mongoose from 'mongoose';

const ZoneSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String },
  description: { type: String },
  sizes: { type: [String], default: [] },
  status: { type: String, enum: ['enabled','disabled'], default: 'enabled' },
  priority: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ZoneSchema.pre('save', function () {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.updatedAt = new Date();
});

export default mongoose.models.Zone || mongoose.model('Zone', ZoneSchema);
