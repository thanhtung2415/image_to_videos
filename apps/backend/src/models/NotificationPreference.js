import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    inAppEnabled: {
      type: Boolean,
      default: true
    },
    browserEnabled: {
      type: Boolean,
      default: true
    },
    emailEnabled: {
      type: Boolean,
      default: false
    },
    videoCompleted: {
      type: Boolean,
      default: true
    },
    paymentEvents: {
      type: Boolean,
      default: true
    },
    securityAlerts: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);

