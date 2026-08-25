import mongoose from 'mongoose';

const generationJobSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoProject',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'post_processing', 'uploading', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'queued',
      index: true
    },
    progress: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 5
    },
    resolution: {
      type: String,
      default: '1280x720'
    },
    provider: {
      type: String,
      default: 'ffmpeg'
    },
    model: {
      type: String,
      default: 'ffmpeg-basic'
    },
    providerGenerationId: {
      type: String,
      default: '',
      index: true
    },
    costCredits: {
      type: Number,
      default: 5
    },
    queueMode: {
      type: String,
      enum: ['local', 'redis'],
      default: 'local'
    },
    queueJobId: {
      type: String,
      default: '',
      index: true
    },
    attemptCount: {
      type: Number,
      default: 0
    },
    errorMessage: {
      type: String,
      default: ''
    },
    startedAt: Date,
    failedAt: Date,
    completedAt: Date
  },
  { timestamps: true }
);

export const GenerationJob = mongoose.model('GenerationJob', generationJobSchema);
