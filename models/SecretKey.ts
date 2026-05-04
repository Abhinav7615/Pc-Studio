import mongoose, { Schema, Document } from 'mongoose';

export interface ISecretKey extends Document {
  code: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  usedCount: number;
  lastUsedAt?: Date;
}

const SecretKeySchema: Schema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 6,
    maxlength: 20
  },
  description: {
    type: String,
    required: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usedCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date
  }
});

// Index for fast lookup
SecretKeySchema.index({ code: 1, isActive: 1 });

export default mongoose.models.SecretKey || mongoose.model<ISecretKey>('SecretKey', SecretKeySchema);