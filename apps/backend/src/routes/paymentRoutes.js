import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { createCheckout, recordPaymentEvent } from '../services/paymentService.js';

export const paymentRoutes = express.Router();

const checkoutSchema = z.object({
  planCode: z.enum(['trial', 'standard', 'pro', 'premium']),
  idempotencyKey: z.string().min(8).max(120)
});

paymentRoutes.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const result = await createCheckout({
      userId: req.user._id,
      planCode: data.planCode,
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

