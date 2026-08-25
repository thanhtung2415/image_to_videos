import crypto from 'crypto';
import { env } from '../config/env.js';
import { Payment } from '../models/Payment.js';
import { PaymentEvent } from '../models/PaymentEvent.js';
import { getPlanForCheckout } from './pricingService.js';
import { purchaseCredits } from './creditService.js';

function createMockCheckoutUrl(paymentId) {
  return `${env.frontendUrl}?payment=mock-success&paymentId=${paymentId}`;
}

export async function createCheckout({ userId, planCode, idempotencyKey }) {
  const plan = await getPlanForCheckout(planCode);

  if (!plan) {
    return {
      ok: false,
      message: 'Goi credit khong hop le'
    };
  }

  const existing = await Payment.findOne({ idempotencyKey });

  if (existing) {
    return {
      ok: true,
      payment: existing
    };
  }

  const payment = await Payment.create({
    user: userId,
    planCode: plan.code,
    provider: env.payment.provider,
    providerPaymentId: crypto.randomUUID(),
    status: env.payment.provider === 'mock' ? 'paid' : 'pending',
    amount: plan.price,
    currency: plan.currency,
    credits: plan.credits,
    checkoutUrl: '',
    idempotencyKey,
    paidAt: env.payment.provider === 'mock' ? new Date() : undefined
  });

  payment.checkoutUrl = env.payment.provider === 'mock' ? createMockCheckoutUrl(payment._id) : '';
  await payment.save();

  if (payment.status === 'paid') {
    await purchaseCredits({
      userId,
      paymentId: payment._id,
      amount: payment.credits,
      idempotencyKey: `purchase:${payment._id}`
    });
  }

  return {
    ok: true,
    payment
  };
}

export async function recordPaymentEvent({ provider, eventType, providerEventId, paymentId, signatureValid, rawBody }) {
  return PaymentEvent.create({
    provider,
    eventType,
    providerEventId,
    payment: paymentId,
    signatureValid,
    rawBody
  });
}

