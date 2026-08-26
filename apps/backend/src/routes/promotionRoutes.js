import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { Promotion } from '../models/Promotion.js';
import { writeAuditLog } from '../services/auditService.js';
import { registerPromotionForUser } from '../services/promotionService.js';

export const promotionRoutes = express.Router();

const registerPromotionSchema = z.object({
  code: z.string().min(3).max(40)
});

promotionRoutes.use(requireAuth);

promotionRoutes.get('/active', async (req, res, next) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      status: 'active',
      startsAt: { $lte: now },
      endsAt: { $gte: now }
    }).sort({ endsAt: 1 });

    res.json({ promotions });
  } catch (error) {
    next(error);
  }
});

promotionRoutes.post('/register', async (req, res, next) => {
  try {
    const data = registerPromotionSchema.parse(req.body);
    const result = await registerPromotionForUser({
      userId: req.user._id,
      code: data.code
    });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'promotion.register',
      resourceType: 'Promotion',
      resourceId: result.promotion._id.toString(),
      req
    });

    res.status(201).json({
      promotion: result.promotion,
      registration: result.registration,
      wallet: result.user.creditWallet
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ban da dang ky promotion nay' });
    }

    next(error);
  }
});
