import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import bcrypt from 'bcryptjs';

async function updateAdminCredentials() {
  const dbConnect = (await import('./mongodb')).default;
  const User = (await import('../models/User')).default;

  await dbConnect();

  const hashedAdminPassword = await bcrypt.hash('admin@123', 12);

  const admin = await User.findOneAndUpdate(
    { role: 'admin' },
    {
      adminEmail: 'admin@example.com',
      adminPassword: hashedAdminPassword,
    },
    { new: true }
  );

  if (admin) {
    console.log('✅ Admin credentials updated!');
    console.log('📧 Admin Email: admin@example.com');
    console.log('🔐 Admin Password: admin@123');
    console.log('');
    console.log('Go to /login and use these credentials to access the admin panel!');
  } else {
    console.log('❌ Admin user not found');
  }

  process.exit(0);
}

updateAdminCredentials().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
