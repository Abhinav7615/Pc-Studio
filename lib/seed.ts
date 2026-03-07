import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import bcrypt from 'bcryptjs';
// defer database imports to avoid hoisting before dotenv runs

async function seedAdmin() {
  const dbConnect = (await import('./mongodb')).default;
  const User = (await import('../models/User')).default;
  const Product = (await import('../models/Product')).default;
  const BusinessSettings = (await import('../models/BusinessSettings')).default;

  await dbConnect();

  const existingAdmin = await User.findOne({ role: 'admin' });

  if (existingAdmin) {
    console.log('Admin already exists');
  } else {
    const hashedPassword = await bcrypt.hash('adminpassword', 12);

    const admin = new User({
      name: 'Admin',
      email: 'yadavabhinav551@gmail.com',
      mobile: '6388391842',
      password: hashedPassword,
      passwordHint: 'Default hint',
      role: 'admin',
    });

    await admin.save();

    console.log('Admin created');
  }

  // Seed business settings
  const existingSettings = await BusinessSettings.findOne();

  if (!existingSettings) {
    const settings = new BusinessSettings({
      websiteName: 'Refurbished PC Studio',
      whatsapp: '1234567890', // placeholder
      contactEmail: 'support@pcstudio.com',
      bankAccountNumber: '1234567890123456', // placeholder
      upiId: 'admin@upi', // placeholder
    });

    await settings.save();
    console.log('Business settings created');
  } else {
    console.log('Business settings already exist');
  }

  // Seed some sample products
  const existingProducts = await Product.find();

  if (existingProducts.length === 0) {
    const products = [
      {
        name: 'Gaming PC 1',
        description: 'High-performance gaming PC with RTX 3080',
        originalPrice: 150000,
        discountPercent: 10,
        images: ['/uploads/sample1.jpg'], // placeholder
      },
      {
        name: 'Office PC 2',
        description: 'Reliable PC for office work',
        originalPrice: 50000,
        discountPercent: 5,
        images: ['/uploads/sample2.jpg'],
      },
      {
        name: 'Laptop 3',
        description: 'Portable laptop for on-the-go',
        originalPrice: 80000,
        discountPercent: 15,
        images: ['/uploads/sample3.jpg'],
      },
    ];

    await Product.insertMany(products);
    console.log('Sample products created');
  } else {
    console.log('Products already exist');
  }
}

seedAdmin().catch(console.error);