import mongoose from 'mongoose';

const costEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    provider: {
      type: String,
      required: true,
      index: true
    },
    model: {
      type: String,
      default: ''
    },
    eventType: {
      type: String,
      enum: ['estimated', 'captured', 'failed', 'refunded'],
      required: true,
      index: true
    },
    credits: {
      type: Number,
      required: true,
      min: 0
    },
    providerCost: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'VND'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

export const CostEvent = mongoose.model('CostEvent', costEventSchema);

