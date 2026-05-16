import mongoose from 'mongoose';

const CallSessionSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true, unique: true },
    initiatorId: { type: String, required: true },
    receiverId: { type: String, default: null },
    roomId: { type: String, required: true },
    status: { type: String, enum: ['initiated', 'ringing', 'active', 'ended'], default: 'initiated' },
    offer: { type: mongoose.Schema.Types.Mixed, default: null },
    answer: { type: mongoose.Schema.Types.Mixed, default: null },
    offerCandidates: { type: [mongoose.Schema.Types.Mixed], default: [] },
    answerCandidates: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.CallSession || mongoose.model('CallSession', CallSessionSchema);
