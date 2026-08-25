import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    credits: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    reason: {
      type: String,
      default: ''
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

export const Refund = mongoose.model('Refund', refundSchema);

