import mongoose from 'mongoose';

const promotionRegistrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion',
      required: true,
      index: true
    },
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion',
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
    },
    creditGranted: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['registered', 'credited'],
      default: 'credited',
      index: true
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

promotionRegistrationSchema.index({ user: 1, promotion: 1 }, { unique: true });
promotionRegistrationSchema.index({ userId: 1, promotionId: 1 }, { unique: true, sparse: true });

promotionRegistrationSchema.pre('validate', function syncRegistrationAliases(next) {
  if (!this.userId) {
    this.userId = this.user;
  }

  if (!this.user) {
    this.user = this.userId;
  }

  if (!this.promotionId) {
    this.promotionId = this.promotion;
  }

  if (!this.promotion) {
    this.promotion = this.promotionId;
  }

  if (!this.creditGranted) {
    this.creditGranted = this.creditBonus;
  }

  if (!this.creditBonus) {
    this.creditBonus = this.creditGranted;
  }

  next();
});

export const PromotionRegistration = mongoose.model('PromotionRegistration', promotionRegistrationSchema);
