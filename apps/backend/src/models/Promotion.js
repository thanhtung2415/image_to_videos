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
    maxRegistrations: {
      type: Number,
      default: 0
    },
    registeredCount: {
      type: Number,
      default: 0
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
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    },
    conditions: {
      type: String,
      trim: true,
      maxlength: 300,
      default: 'One registration per user'
    }
  },
  { timestamps: true }
);

export const Promotion = mongoose.model('Promotion', promotionSchema);
