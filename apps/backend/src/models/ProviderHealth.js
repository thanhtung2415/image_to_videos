import mongoose from 'mongoose';

const providerHealthSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['unknown', 'healthy', 'degraded', 'down', 'disabled'],
      default: 'unknown',
      index: true
    },
    enabled: {
      type: Boolean,
      default: false
    },
    latencyMs: {
      type: Number,
      default: 0
    },
    lastCheckedAt: Date,
    lastError: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const ProviderHealth = mongoose.model('ProviderHealth', providerHealthSchema);

