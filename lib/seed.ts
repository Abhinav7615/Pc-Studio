import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import bcrypt from 'bcryptjs';
// defer database imports to avoid hoisting before dotenv runs

async function seedAdmin() {
  const dbConnect = (await import('./mongodb')).default;
  const User = (await import('../models/User')).default;
  const Product = (await import('../models/Product')).default;
  const BusinessSettings = (await import('../models/BusinessSettings')).default;
  const Content = (await import('../models/Content')).default;

  await dbConnect();

  const existingAdmin = await User.findOne({ role: 'admin' });

  if (existingAdmin) {
    console.log('Admin already exists');
  } else {
    const hashedPassword = await bcrypt.hash('adminpassword', 12);
    const hashedAdminPassword = await bcrypt.hash('admin@123', 12);

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

    console.log('Admin created with credentials:');
    console.log('Admin Email: admin@example.com');
    console.log('Admin Password: admin@123');
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
        images: [],
      },
      {
        name: 'Office PC 2',
        description: 'Reliable PC for office work',
        originalPrice: 50000,
        discountPercent: 5,
        images: [],
      },
      {
        name: 'Laptop 3',
        description: 'Portable laptop for on-the-go',
        originalPrice: 80000,
        discountPercent: 15,
        images: [],
      },
    ];

    await Product.insertMany(products);
    console.log('Sample products created');
  } else {
    console.log('Products already exist');
  }

  // Seed some sample content
  const existingContent = await Content.find();

  if (existingContent.length === 0) {
    const contents = [
      {
        key: 'homepage-hero',
        title: 'Welcome to Refurbished PC Studio',
        content: 'Discover high-quality refurbished computers at unbeatable prices. All our products are thoroughly tested and come with warranty.',
      },
      {
        key: 'about-us',
        title: 'About Us',
        content: 'We are a trusted provider of refurbished computers, laptops, and accessories. Our mission is to make quality technology accessible to everyone.',
      },
      {
        key: 'contact-info',
        title: 'Contact Information',
        content: 'Get in touch with us for any queries or support. We are here to help you find the perfect refurbished PC for your needs.',
      },
    ];

    await Content.insertMany(contents);
    console.log('Sample content created');
  } else {
    console.log('Content already exists');
  }
}

seedAdmin().catch(console.error);