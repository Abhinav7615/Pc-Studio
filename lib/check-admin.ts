import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function main() {
  await dbConnect();
  const u = await User.findOne({ mobile: '6388391842' });
  if (!u) {
    console.log('user not found');
  } else {
    console.log('user', {
      mobile: u.mobile,
      email: u.email,
      role: u.role,
      adminEmail: u.adminEmail,
      blocked: u.blocked,
    });
  }
  process.exit(0);
}
main().catch((err) => { console.error(err); process.exit(1); });
