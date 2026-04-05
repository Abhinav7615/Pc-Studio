import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function main() {
  await dbConnect();
  const mobile = '6388391842';
  const password = '123456';

  const hashed = await bcrypt.hash(password, 12);

  let user = await User.findOne({ mobile });
  if (!user) {
    user = new User({
      name: 'Admin',
      email: 'admin@example.com',
      mobile,
      password: hashed,
      passwordHint: 'My admin login',
      role: 'admin',
      blocked: false,
      adminEmail: 'admin@example.com',
      adminPassword: hashed,
    });
    await user.save();
    console.log('Created new admin user with mobile', mobile);
  } else {
    user.name = 'Admin';
    user.email = 'admin@example.com';
    user.password = hashed;
    user.passwordHint = 'My admin login';
    user.role = 'admin';
    user.blocked = false;
    user.adminEmail = 'admin@example.com';
    user.adminPassword = hashed;
    await user.save();
    console.log('Updated existing user to admin with mobile', mobile);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
