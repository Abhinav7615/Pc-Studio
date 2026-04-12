require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const rawMongoUri = process.env.MONGODB_URI;
if (!rawMongoUri) {
  console.error('NO_URI');
  process.exit(1);
}

(async () => {
  await mongoose.connect(rawMongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    passwordHint: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    blocked: { type: Boolean, default: false },
    adminEmail: { type: String, unique: true, sparse: true },
    adminPassword: { type: String },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerId: { type: String, unique: true, index: true, default: () => `CUST${Math.random().toString(36).substring(2, 10).toUpperCase()}` },
    pendingReferralBonus: { type: Number, default: 0 },
    usedReferralBonus: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  });
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin already exists');
    console.log({
      email: existing.email,
      mobile: existing.mobile,
      role: existing.role,
      adminEmail: existing.adminEmail,
      hasAdminPassword: !!existing.adminPassword,
    });
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('adminpassword', 12);
  const hashedAdminPassword = await bcrypt.hash('123456', 12);

  const admin = new User({
    name: 'Admin',
    email: 'yadavabhinav551@gmail.com',
    mobile: '6388391842',
    password: hashedPassword,
    passwordHint: 'Default hint',
    role: 'admin',
    adminEmail: 'admin@example.com',
    adminPassword: hashedAdminPassword,
  });

  await admin.save();
  console.log('Admin created');
  console.log({
    email: admin.email,
    mobile: admin.mobile,
    role: admin.role,
    adminEmail: admin.adminEmail,
    hasAdminPassword: !!admin.adminPassword,
  });
  await mongoose.disconnect();
})();
