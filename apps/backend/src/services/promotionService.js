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

  const registration = await PromotionRegistration.create({
    user: userId,
    promotion: promotion._id,
    code: promotion.code,
    creditBonus: promotion.creditBonus
  });

  await Promotion.findByIdAndUpdate(promotion._id, {
    $inc: { registeredCount: 1 }
  });

  const user = await grantPromotionCredits({
    userId,
    promotionId: promotion._id,
    code: promotion.code,
    amount: promotion.creditBonus,
    idempotencyKey: `promotion:${registration._id}`
  });

  return {
    ok: true,
    promotion,
    registration,
    user
  };
}
