import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    },
    creditBonus: {
      type: Number,
      required: true,
      min: 1
    },
    bonusCredit: {
      type: Number,
      min: 1
    },
    maxRegistrations: {
      type: Number,
      default: 0
    },
    registeredCount: {
      type: Number,
      default: 0
    },
    currentRegistrations: {
      type: Number,
      default: 0
    },
    startAt: {
      type: Date,
      index: true
    },
    endAt: {
      type: Date,
      index: true
    },
    startsAt: {
      type: Date,
      required: true,
      index: true
    },
    endsAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'expired'],
      default: 'active',
      index: true
    },
    conditions: {
      type: String,
      trim: true,
      maxlength: 300,
      default: 'One registration per user'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  },
  { timestamps: true }
);

promotionSchema.pre('validate', function syncPromotionAliases(next) {
  if (!this.bonusCredit) {
    this.bonusCredit = this.creditBonus;
  }

  if (!this.creditBonus) {
    this.creditBonus = this.bonusCredit;
  }

  if (!this.startAt) {
    this.startAt = this.startsAt;
  }

  if (!this.startsAt) {
    this.startsAt = this.startAt;
  }

  if (!this.endAt) {
    this.endAt = this.endsAt;
  }

  if (!this.endsAt) {
    this.endsAt = this.endAt;
  }

  if (this.currentRegistrations === undefined || this.currentRegistrations === null) {
    this.currentRegistrations = this.registeredCount || 0;
  }

  next();
});

export const Promotion = mongoose.model('Promotion', promotionSchema);
