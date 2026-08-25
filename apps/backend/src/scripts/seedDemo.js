import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import { Coupon } from '../models/Coupon.js';
import { User } from '../models/User.js';
import { seedDefaultPricingPlans } from '../services/pricingService.js';

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { email },
    {
      name,
      email,
      passwordHash,
      role,
      status: 'active',
      creditWallet: {
        availableCredit: 100,
        reservedCredit: 0,
        lifetimePurchased: 100,
        lifetimeUsed: 0
      }
    },
    { upsert: true, new: true }
  );
}

async function seedDemo() {
  await connectDatabase();
  await seedDefaultPricingPlans();

  await Promise.all([
    upsertUser({
      name: 'Admin Demo',
      email: 'admin@example.com',
      password: '123456',
      role: 'admin'
    }),
    upsertUser({
      name: 'User Demo',
      email: 'user@example.com',
      password: '123456',
      role: 'user'
    })
  ]);

  await Coupon.findOneAndUpdate(
    { code: 'SALE20' },
    {
      code: 'SALE20',
      type: 'percent',
      value: 20,
      active: true,
      maxUses: 100
    },
    { upsert: true, new: true }
  );

  console.log('Demo data seeded');
  process.exit(0);
}

seedDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});

