import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    planCode: {
      type: String,
      required: true
    },
    provider: {
      type: String,
      enum: ['mock', 'payos', 'stripe'],
      default: 'mock',
      index: true
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'created',
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND'
    },
    credits: {
      type: Number,
      required: true,
      min: 0
    },
    checkoutUrl: {
      type: String,
      default: ''
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true
    },
    paidAt: Date
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);

