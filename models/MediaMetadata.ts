import mongoose, { Schema } from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';

const mediaMetadataSchema = new Schema({
  fileId: mongoose.Types.ObjectId,
  fileName: String,
  fileSize: Number,
  contentType: String,
  category: {
    type: String,
    enum: ['product', 'payment', 'order', 'support', 'user_profile', 'other'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['product_image', 'product_video', 'payment_screenshot', 'payment_receipt', 'invoice', 'proof_of_delivery', 'support_attachment', 'identity_proof', 'other'],
    required: true
  },
  linkedToProduct: mongoose.Types.ObjectId,
  linkedToOrder: mongoose.Types.ObjectId,
  linkedToUser: mongoose.Types.ObjectId,
  linkedToTicket: mongoose.Types.ObjectId,
  linkedToPayment: mongoose.Types.ObjectId,
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active'
  },
  uploadedBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: Date,
  deletedAt: Date,
  deletedBy: mongoose.Types.ObjectId,
  permanentlyDeletedAt: Date,
  inRecycleBin: {
    type: Boolean,
    default: false
  },
  recycleBinAddedAt: Date,
  recycleBinExpiresAt: Date,
  tags: [String],
  expiryDate: Date,
  isTemporary: Boolean,
  accessCount: {
    type: Number,
    default: 0
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

mediaMetadataSchema.index({ status: 1 });
mediaMetadataSchema.index({ category: 1, purpose: 1 });
mediaMetadataSchema.index({ linkedToProduct: 1 });
mediaMetadataSchema.index({ linkedToOrder: 1 });
mediaMetadataSchema.index({ uploadedAt: -1 });
mediaMetadataSchema.index({ recycleBinExpiresAt: 1 });
mediaMetadataSchema.index({ expiryDate: 1 });

const conn = mediaConnection || mongoose;
const MediaMetadata = (conn.models && conn.models.MediaMetadata) || conn.model('MediaMetadata', mediaMetadataSchema);
export default MediaMetadata;
