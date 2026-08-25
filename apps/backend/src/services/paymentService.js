import crypto from 'crypto';
import { env } from '../config/env.js';
import { Coupon } from '../models/Coupon.js';
import { Payment } from '../models/Payment.js';
import { PaymentEvent } from '../models/PaymentEvent.js';
import { Refund } from '../models/Refund.js';
import { getPlanForCheckout } from './pricingService.js';
import { purchaseCredits, refundPurchasedCredits } from './creditService.js';
import { notifyUser } from './notificationService.js';

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

    await notifyUser({
      userId,
      type: 'CREDIT_PURCHASED',
      title: 'Credit da duoc cong',
      message: `Ban da mua thanh cong ${payment.credits} credits.`,
      metadata: {
        paymentId: payment._id
      }
    });
  }

  return {
    ok: true,
    payment
  };
}

export async function createCheckoutWithCoupon({ userId, planCode, couponCode, idempotencyKey }) {
  const plan = await getPlanForCheckout(planCode);

  if (!plan) {
    return {
      ok: false,
      message: 'Goi credit khong hop le'
    };
  }

  const existing = await Payment.findOne({ idempotencyKey });

  if (existing) {
    return { ok: true, payment: existing };
  }

  let discountAmount = 0;
  let normalizedCouponCode = '';

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
    const expired = coupon?.expiresAt && coupon.expiresAt < new Date();
    const maxedOut = coupon?.maxUses > 0 && coupon.usedCount >= coupon.maxUses;

    if (!coupon || expired || maxedOut) {
      return {
        ok: false,
        message: 'Ma giam gia khong hop le'
      };
    }

    normalizedCouponCode = coupon.code;
    discountAmount = coupon.type === 'percent'
      ? Math.round((plan.price * coupon.value) / 100)
      : coupon.value;
    discountAmount = Math.min(discountAmount, plan.price);
    coupon.usedCount += 1;
    await coupon.save();
  }

  const finalAmount = Math.max(0, plan.price - discountAmount);
  const payment = await Payment.create({
    user: userId,
    planCode: plan.code,
    provider: env.payment.provider,
    providerPaymentId: crypto.randomUUID(),
    status: env.payment.provider === 'mock' ? 'paid' : 'pending',
    amount: finalAmount,
    originalAmount: plan.price,
    discountAmount,
    couponCode: normalizedCouponCode,
    currency: plan.currency,
    credits: plan.credits,
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

    await notifyUser({
      userId,
      type: 'CREDIT_PURCHASED',
      title: 'Credit da duoc cong',
      message: `Ban da mua thanh cong ${payment.credits} credits.`,
      metadata: {
        paymentId: payment._id
      }
    });
  }

  return { ok: true, payment };
}

export async function refundPayment({ paymentId, reason, idempotencyKey }) {
  const existing = await Refund.findOne({ idempotencyKey });

  if (existing) {
    return { ok: true, refund: existing };
  }

  const payment = await Payment.findById(paymentId);

  if (!payment || payment.status !== 'paid') {
    return {
      ok: false,
      message: 'Payment khong the refund'
    };
  }

  const user = await refundPurchasedCredits({
    userId: payment.user,
    paymentId: payment._id,
    amount: payment.credits,
    idempotencyKey: `refund-credit:${payment._id}`
  });

  if (!user) {
    return {
      ok: false,
      message: 'Khong du credit kha dung de refund'
    };
  }

  payment.status = 'refunded';
  await payment.save();

  const refund = await Refund.create({
    payment: payment._id,
    user: payment.user,
    amount: payment.amount,
    credits: payment.credits,
    status: 'completed',
    reason,
    idempotencyKey
  });

  await notifyUser({
    userId: payment.user,
    type: 'CREDIT_REFUNDED',
    title: 'Payment da duoc refund',
    message: `${payment.credits} credits da duoc tru khoi vi theo lenh refund.`,
    metadata: {
      paymentId: payment._id,
      refundId: refund._id
    }
  });

  return { ok: true, refund };
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
