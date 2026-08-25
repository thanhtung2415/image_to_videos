import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'VIDEO_QUEUED',
        'VIDEO_PROCESSING',
        'VIDEO_COMPLETED',
        'VIDEO_FAILED',
        'VIDEO_CANCELLED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'CREDIT_PURCHASED',
        'CREDIT_REFUNDED',
        'SECURITY_ALERT'
      ],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    readAt: Date,
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
