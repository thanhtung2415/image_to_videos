import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { Promotion } from '../models/Promotion.js';
import { PromotionRegistration } from '../models/PromotionRegistration.js';
import { grantPromotionCredits } from '../services/creditService.js';
import { writeAuditLog } from '../services/auditService.js';

export const promotionRoutes = express.Router();

const registerPromotionSchema = z.object({
  code: z.string().min(3).max(40)
});

function promotionIsAvailable(promotion) {
  const now = new Date();

  if (!promotion || promotion.status !== 'active') {
    return false;
  }

  if (promotion.startsAt > now || promotion.endsAt < now) {
    return false;
  }

  return !promotion.maxRegistrations || promotion.registeredCount < promotion.maxRegistrations;
}

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
    const code = data.code.toUpperCase();
    const promotion = await Promotion.findOne({ code });

    if (!promotionIsAvailable(promotion)) {
      return res.status(400).json({ message: 'Promotion khong hop le hoac da het han' });
    }

    const exists = await PromotionRegistration.findOne({
      user: req.user._id,
      promotion: promotion._id
    });

    if (exists) {
      return res.status(409).json({ message: 'Ban da dang ky promotion nay' });
    }

    const registration = await PromotionRegistration.create({
      user: req.user._id,
      promotion: promotion._id,
      code: promotion.code,
      creditBonus: promotion.creditBonus
    });

    await Promotion.findByIdAndUpdate(promotion._id, {
      $inc: { registeredCount: 1 }
    });

    const user = await grantPromotionCredits({
      userId: req.user._id,
      promotionId: promotion._id,
      code: promotion.code,
      amount: promotion.creditBonus,
      idempotencyKey: `promotion:${registration._id}`
    });

    await writeAuditLog({
      actor: req.user._id,
      action: 'promotion.register',
      resourceType: 'Promotion',
      resourceId: promotion._id.toString(),
      req
    });

    res.status(201).json({ promotion, registration, wallet: user.creditWallet });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ban da dang ky promotion nay' });
    }

    next(error);
  }
});
