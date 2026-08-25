import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent'
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    maxUses: {
      type: Number,
      default: 0
    },
    usedCount: {
      type: Number,
      default: 0
    },
    expiresAt: Date
  },
  { timestamps: true }
);

export const Coupon = mongoose.model('Coupon', couponSchema);

