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
  await Promise.all(
    defaultPlans.map((plan) => PricingPlan.findOneAndUpdate(
      { code: plan.code },
      { $setOnInsert: { ...plan, active: true } },
      { upsert: true, new: true }
    ))
  );
}

export async function listActivePlans() {
  await seedDefaultPricingPlans();
  return PricingPlan.find({ active: true }).sort({ sortOrder: 1 });
}

export async function getPlanForCheckout(planCode) {
  await seedDefaultPricingPlans();
  return PricingPlan.findOne({ code: planCode, active: true });
}
