import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { createCheckoutWithCoupon, recordPaymentEvent, refundPayment } from '../services/paymentService.js';

export const paymentRoutes = express.Router();

const checkoutSchema = z.object({
  planCode: z.enum(['trial', 'standard', 'pro', 'premium']),
  couponCode: z.string().max(40).optional().default(''),
  idempotencyKey: z.string().min(8).max(120)
});

const refundSchema = z.object({
  reason: z.string().max(300).optional().default('Admin refund'),
  idempotencyKey: z.string().min(8).max(120)
});

paymentRoutes.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const result = await createCheckoutWithCoupon({
      userId: req.user._id,
      planCode: data.planCode,
      couponCode: data.couponCode,
      idempotencyKey: data.idempotencyKey
    });

    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    res.status(201).json({ payment: result.payment });
  } catch (error) {
    next(error);
  }
});

paymentRoutes.post('/:id/refund', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = refundSchema.parse(req.body);
    const result = await refundPayment({
      paymentId: req.params.id,
      reason: data.reason,
      idempotencyKey: data.idempotencyKey
    });

    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    res.status(201).json({ refund: result.refund });
  } catch (error) {
    next(error);
  }
});

paymentRoutes.post('/webhooks/:provider', express.json({ type: '*/*' }), async (req, res, next) => {
  try {
    await recordPaymentEvent({
      provider: req.params.provider,
      eventType: req.body?.type || 'unknown',
      providerEventId: req.body?.id || '',
      signatureValid: false,
      rawBody: req.body
    });

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});
