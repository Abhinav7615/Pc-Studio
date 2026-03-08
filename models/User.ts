import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordHint: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
  blocked: { type: Boolean, default: false },
  referralCode: { type: String, unique: true, sparse: true }, // Unique referral code for inviting friends
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who referred this user
  pendingReferralBonus: { type: Number, default: 0 }, // Bonus amount waiting to be used
  usedReferralBonus: { type: Boolean, default: false }, // Whether referral bonus has been used
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);