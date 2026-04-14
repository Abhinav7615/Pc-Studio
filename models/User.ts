import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordHint: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
  blocked: { type: Boolean, default: false },
  adminEmail: { type: String, unique: true, sparse: true }, // Separate admin credentials
  adminPassword: { type: String }, // Hashed admin password
  referralCode: { type: String, unique: true, sparse: true }, // Unique referral code for inviting friends
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who referred this user
  customerId: { type: String, unique: true, index: true, default: () => `CUST${Math.random().toString(36).substring(2, 10).toUpperCase()}` }, // Unique internal ID for tracking
  pendingReferralBonus: { type: Number, default: 0 }, // Bonus amount waiting to be used
  usedReferralBonus: { type: Boolean, default: false }, // Whether referral bonus has been used
  notificationPreferences: {
    orderUpdates: { type: Boolean, default: true },
    bargain: { type: Boolean, default: true },
    outbid: { type: Boolean, default: true },
    auction: { type: Boolean, default: true },
    adminMessages: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);