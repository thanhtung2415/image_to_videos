import { Promotion } from '../models/Promotion.js';
import { PromotionRegistration } from '../models/PromotionRegistration.js';
import { grantPromotionCredits } from './creditService.js';

export function promotionIsAvailable(promotion) {
  const now = new Date();
  const start = promotion?.startAt || promotion?.startsAt;
  const end = promotion?.endAt || promotion?.endsAt;
  const registrations = promotion?.currentRegistrations ?? promotion?.registeredCount ?? 0;

  if (!promotion || promotion.status !== 'active') {
    return false;
  }

  if (start > now || end < now) {
    return false;
  }

  return !promotion.maxRegistrations || registrations < promotion.maxRegistrations;
}

export async function validatePromotionCode(codeOrId) {
  const value = String(codeOrId || '').trim();
  const promotion = value.match(/^[a-f\d]{24}$/i)
    ? await Promotion.findById(value)
    : await Promotion.findOne({ code: value.toUpperCase() });

  if (!promotionIsAvailable(promotion)) {
    return {
      ok: false,
      status: 400,
      message: 'Promotion khong hop le hoac da het han'
    };
  }

  return { ok: true, promotion };
}

export async function registerPromotionForUser({ userId, code, promotionId }) {
  const validation = await validatePromotionCode(promotionId || code);

  if (!validation.ok) {
    return validation;
  }

  const promotion = validation.promotion;
  const now = new Date();
  const exists = await PromotionRegistration.findOne({
    $or: [
      { user: userId, promotion: promotion._id },
      { userId, promotionId: promotion._id }
    ]
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
      $or: [
        { startAt: { $lte: now } },
        { startsAt: { $lte: now } }
      ],
      $and: [
        {
          $or: [
            { endAt: { $gte: now } },
            { endsAt: { $gte: now } }
          ]
        },
        {
          $or: [
            { maxRegistrations: 0 },
            { $expr: { $lt: ['$registeredCount', '$maxRegistrations'] } },
            { $expr: { $lt: ['$currentRegistrations', '$maxRegistrations'] } }
          ]
        }
      ]
    },
    { $inc: { registeredCount: 1, currentRegistrations: 1 } },
    { new: true }
  );

  if (!updatedPromotion) {
    return {
      ok: false,
      status: 400,
      message: 'Promotion khong hop le hoac da het han'
    };
  }

  let registration;

  try {
    registration = await PromotionRegistration.create({
      user: userId,
      userId,
      promotion: updatedPromotion._id,
      promotionId: updatedPromotion._id,
      code: updatedPromotion.code,
      creditBonus: updatedPromotion.creditBonus,
      creditGranted: updatedPromotion.creditBonus,
      status: 'credited',
      registeredAt: now
    });

    const user = await grantPromotionCredits({
      userId,
      promotionId: updatedPromotion._id,
      code: updatedPromotion.code,
      amount: updatedPromotion.creditBonus,
      idempotencyKey: `promotion:${registration._id}`
    });

    if (!user) {
      await PromotionRegistration.deleteOne({ _id: registration._id });
      await Promotion.findByIdAndUpdate(updatedPromotion._id, {
        $inc: { registeredCount: -1, currentRegistrations: -1 }
      });

      return {
        ok: false,
        status: 400,
        message: 'Khong the cong credit promotion'
      };
    }

    return {
      ok: true,
      promotion: updatedPromotion,
      registration,
      user
    };
  } catch (error) {
    if (registration?._id) {
      await PromotionRegistration.deleteOne({ _id: registration._id });
    }

    await Promotion.findByIdAndUpdate(updatedPromotion._id, {
      $inc: { registeredCount: -1, currentRegistrations: -1 }
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
