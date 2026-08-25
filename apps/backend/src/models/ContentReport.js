import mongoose from 'mongoose';

const contentReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoProject',
      required: true,
      index: true
    },
    reason: {
      type: String,
      required: true,
      maxlength: 300
    },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'dismissed'],
      default: 'open',
      index: true
    }
  },
  { timestamps: true }
);

export const ContentReport = mongoose.model('ContentReport', contentReportSchema);

