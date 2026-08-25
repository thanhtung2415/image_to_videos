import mongoose from 'mongoose';

const paymentEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    providerEventId: {
      type: String,
      default: '',
      index: true
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      index: true
    },
    signatureValid: {
      type: Boolean,
      default: false
    },
    rawBody: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

export const PaymentEvent = mongoose.model('PaymentEvent', paymentEventSchema);

