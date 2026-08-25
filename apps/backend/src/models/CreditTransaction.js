import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoProject',
      index: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GenerationJob',
      index: true
    },
    type: {
      type: String,
      enum: ['purchase', 'reserve', 'capture', 'release', 'refund'],
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    balanceAfter: {
      availableCredit: Number,
      reservedCredit: Number,
      lifetimePurchased: Number,
      lifetimeUsed: Number
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true
    },
    note: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

