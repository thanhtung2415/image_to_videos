import { PricingPlan } from '../models/PricingPlan.js';

const defaultPlans = [
  {
    code: 'trial',
    name: 'Trial',
    credits: 20,
    price: 0,
    currency: 'VND',
    sortOrder: 1
  },
  {
    code: 'standard',
    name: 'Standard',
    credits: 100,
    price: 49000,
    currency: 'VND',
    sortOrder: 2
  },
  {
    code: 'pro',
    name: 'Pro',
    credits: 300,
    price: 129000,
    currency: 'VND',
    sortOrder: 3
  },
  {
    code: 'premium',
    name: 'Premium',
    credits: 800,
    price: 299000,
    currency: 'VND',
    sortOrder: 4
  }
];

export async function seedDefaultPricingPlans() {
  const count = await PricingPlan.countDocuments();

  if (count > 0) {
    return;
  }

  await PricingPlan.insertMany(defaultPlans);
}

export async function listActivePlans() {
  await seedDefaultPricingPlans();
  return PricingPlan.find({ active: true }).sort({ sortOrder: 1 });
}

export async function getPlanForCheckout(planCode) {
  await seedDefaultPricingPlans();
  return PricingPlan.findOne({ code: planCode, active: true });
}

