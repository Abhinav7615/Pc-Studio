import mongoose, { Schema } from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';

const deletedMediaSchema = new Schema({
  originalMetadataId: mongoose.Types.ObjectId,
  fileId: mongoose.Types.ObjectId,
  fileName: String,
  fileSize: Number,
  category: String,
  purpose: String,
  deletedAt: {
    type: Date,
    default: Date.now
  },
  deletedBy: mongoose.Types.ObjectId,
  reason: {
    type: String,
    enum: ['manual', 'auto_cleanup', 'user_request', 'order_complete'],
    required: true
  },
  linkedObjects: {
    productId: mongoose.Types.ObjectId,
    orderId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    ticketId: mongoose.Types.ObjectId
  },
  recoveryDeadline: Date,
  recoveredAt: Date,
  metadata: Schema.Types.Mixed
}, { timestamps: true });

deletedMediaSchema.index({ recoveryDeadline: 1 });
deletedMediaSchema.index({ deletedAt: -1 });
deletedMediaSchema.index({ originalMetadataId: 1 });

const conn = mediaConnection || mongoose;
const DeletedMedia = (conn.models && conn.models.DeletedMedia) || conn.model('DeletedMedia', deletedMediaSchema);
export default DeletedMedia;
