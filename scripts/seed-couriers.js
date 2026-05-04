import connectDB from '../lib/mongodb';
import CourierPartner from '../models/CourierPartner';

const seedCouriers = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing couriers
    await CourierPartner.deleteMany({});
    console.log('Cleared existing couriers');

    // Sample courier data
    const couriers = [
      {
        name: 'Delhivery',
        code: 'DL',
        apiKey: 'DEMO_DELHIVERY_KEY',
        baseUrl: 'https://api.delhivery.com',
        isActive: true,
        supportsCOD: true,
        supportsPrepaid: true,
        maxWeightKg: 30,
        minWeightKg: 0.1,
        baseRate: 45,
        additionalRate: 10,
        codChargePercent: 2.5,
        fuelSurchargePercent: 2,
        successRate: 94,
        averageDeliveryDays: 2.5,
        rtoRate: 6,
        serviceablePincodes: ['110001', '400001', '560001', '600001', '700001']
      },
      {
        name: 'Ekart',
        code: 'EK',
        apiKey: 'DEMO_EKART_KEY',
        baseUrl: 'https://api.ekartlogistics.com',
        isActive: true,
        supportsCOD: true,
        supportsPrepaid: true,
        maxWeightKg: 25,
        minWeightKg: 0.1,
        baseRate: 42,
        additionalRate: 8,
        codChargePercent: 2.2,
        fuelSurchargePercent: 1.8,
        successRate: 96,
        averageDeliveryDays: 2.8,
        rtoRate: 4,
        serviceablePincodes: ['110001', '400001', '560001', '600001', '700001']
      },
      {
        name: 'XpressBees',
        code: 'XB',
        apiKey: 'DEMO_XPRESSBEES_KEY',
        baseUrl: 'https://api.xpressbees.com',
        isActive: true,
        supportsCOD: true,
        supportsPrepaid: true,
        maxWeightKg: 20,
        minWeightKg: 0.1,
        baseRate: 48,
        additionalRate: 12,
        codChargePercent: 2.8,
        fuelSurchargePercent: 2.5,
        successRate: 92,
        averageDeliveryDays: 3.2,
        rtoRate: 8,
        serviceablePincodes: ['110001', '400001', '560001', '600001', '700001']
      },
      {
        name: 'Shadowfax',
        code: 'SF',
        apiKey: 'DEMO_SHADOWFAX_KEY',
        baseUrl: 'https://api.shadowfax.com',
        isActive: true,
        supportsCOD: true,
        supportsPrepaid: true,
        maxWeightKg: 15,
        minWeightKg: 0.1,
        baseRate: 40,
        additionalRate: 6,
        codChargePercent: 2.0,
        fuelSurchargePercent: 1.5,
        successRate: 95,
        averageDeliveryDays: 1.8,
        rtoRate: 5,
        serviceablePincodes: ['110001', '400001', '560001', '600001', '700001']
      },
      {
        name: 'Ecom Express',
        code: 'EE',
        apiKey: 'DEMO_ECOMEXPRESS_KEY',
        baseUrl: 'https://api.ecomexpress.com',
        isActive: true,
        supportsCOD: true,
        supportsPrepaid: true,
        maxWeightKg: 35,
        minWeightKg: 0.1,
        baseRate: 50,
        additionalRate: 15,
        codChargePercent: 3.0,
        fuelSurchargePercent: 2.8,
        successRate: 90,
        averageDeliveryDays: 3.5,
        rtoRate: 9,
        serviceablePincodes: ['110001', '400001', '560001', '600001', '700001']
      },
      {
        name: 'Shiprocket',
        code: 'SR',
        apiKey: 'DEMO_SHIPROCKET_KEY',
        baseUrl: 'https://apiv2.shiprocket.in',
        isActive: false, // Disabled by default, needs configuration
        supportsCOD: true,
        supportsPrepaid: true,
        maxWeightKg: 20,
        minWeightKg: 0.1,
        baseRate: 44,
        additionalRate: 9,
        codChargePercent: 2.3,
        fuelSurchargePercent: 2.1,
        successRate: 93,
        averageDeliveryDays: 2.9,
        rtoRate: 7,
        serviceablePincodes: ['110001', '400001', '560001', '600001', '700001']
      }
    ];

    // Insert couriers
    const insertedCouriers = await CourierPartner.insertMany(couriers);
    console.log(`Seeded ${insertedCouriers.length} courier partners`);

    // Log the inserted couriers
    insertedCouriers.forEach(courier => {
      console.log(`- ${courier.name} (${courier.code}): ₹${courier.baseRate}/kg, ${courier.successRate}% success rate`);
    });

    console.log('Courier seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding couriers:', error);
    process.exit(1);
  }
};

// Run the seed function
seedCouriers();