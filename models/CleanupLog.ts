import mongoose, { Schema } from 'mongoose';

const cleanupLogSchema = new Schema({
  cleanupType: {
    type: String,
    enum: ['automatic', 'manual', 'scheduled'],
    required: true
  },
  executedAt: {
    type: Date,
    default: Date.now
  },
  executedBy: mongoose.Types.ObjectId,
  filesDeleted: Number,
  spaceFreed: Number,
  spaceFreedMB: Number,
  deletionReason: String,
  deletedMediaIds: [mongoose.Types.ObjectId],
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  errorLog: String,
  storageStatusBefore: {
    usedMB: Number,
    usagePercent: Number
  },
  storageStatusAfter: {
    usedMB: Number,
    usagePercent: Number
  }
}, { timestamps: true });

cleanupLogSchema.index({ executedAt: -1 });
cleanupLogSchema.index({ cleanupType: 1 });
cleanupLogSchema.index({ status: 1 });

const CleanupLog = mongoose.models.CleanupLog || mongoose.model('CleanupLog', cleanupLogSchema);
export default CleanupLog;
