import { Promotion } from '../models/Promotion.js';
import { PromotionRegistration } from '../models/PromotionRegistration.js';
import { grantPromotionCredits } from './creditService.js';

export function promotionIsAvailable(promotion) {
  const now = new Date();

  if (!promotion || promotion.status !== 'active') {
    return false;
  }

  if (promotion.startsAt > now || promotion.endsAt < now) {
    return false;
  }

  return !promotion.maxRegistrations || promotion.registeredCount < promotion.maxRegistrations;
}

export async function validatePromotionCode(code) {
  const promotion = await Promotion.findOne({ code: code.toUpperCase() });

  if (!promotionIsAvailable(promotion)) {
    return {
      ok: false,
      status: 400,
      message: 'Promotion khong hop le hoac da het han'
    };
  }

  return { ok: true, promotion };
}

export async function registerPromotionForUser({ userId, code }) {
  const validation = await validatePromotionCode(code);

  if (!validation.ok) {
    return validation;
  }

  const promotion = validation.promotion;
  const now = new Date();
  const exists = await PromotionRegistration.findOne({
    user: userId,
    promotion: promotion._id
  });

  if (exists) {
    return {
      ok: false,
      status: 409,
      message: 'Ban da dang ky promotion nay'
    };
  }

  const updatedPromotion = await Promotion.findOneAndUpdate(
    {
      _id: promotion._id,
      status: 'active',
      startsAt: { $lte: now },
      endsAt: { $gte: now },
      $or: [
        { maxRegistrations: 0 },
        { $expr: { $lt: ['$registeredCount', '$maxRegistrations'] } }
      ]
    },
    { $inc: { registeredCount: 1 } },
    { new: true }
  );

  if (!updatedPromotion) {
    return {
      ok: false,
      status: 400,
      message: 'Promotion khong hop le hoac da het han'
    };
  }

  try {
    const registration = await PromotionRegistration.create({
      user: userId,
      promotion: updatedPromotion._id,
      code: updatedPromotion.code,
      creditBonus: updatedPromotion.creditBonus
    });

    const user = await grantPromotionCredits({
      userId,
      promotionId: updatedPromotion._id,
      code: updatedPromotion.code,
      amount: updatedPromotion.creditBonus,
      idempotencyKey: `promotion:${registration._id}`
    });

    return {
      ok: true,
      promotion: updatedPromotion,
      registration,
      user
    };
  } catch (error) {
    await Promotion.findByIdAndUpdate(updatedPromotion._id, {
      $inc: { registeredCount: -1 }
    });

    if (error.code === 11000) {
      return {
        ok: false,
        status: 409,
        message: 'Ban da dang ky promotion nay'
      };
    }

    throw error;
  }
}
