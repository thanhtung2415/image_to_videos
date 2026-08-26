import mongoose from 'mongoose';

const promotionRegistrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion',
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    creditBonus: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

promotionRegistrationSchema.index({ user: 1, promotion: 1 }, { unique: true });

export const PromotionRegistration = mongoose.model('PromotionRegistration', promotionRegistrationSchema);
