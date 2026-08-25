import mongoose from 'mongoose';

const videoProjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    prompt: {
      type: String,
      trim: true,
      maxlength: 600,
      default: ''
    },
    sourceImage: {
      url: String,
      path: String,
      publicId: String,
      originalName: String,
      mimeType: String,
      size: Number
    },
    outputVideo: {
      url: String,
      path: String,
      publicId: String,
      duration: Number,
      resolution: String
    },
    status: {
      type: String,
      enum: ['draft', 'queued', 'processing', 'post_processing', 'uploading', 'completed', 'failed', 'cancelled'],
      default: 'draft',
      index: true
    },
    generationMode: {
      type: String,
      enum: ['ffmpeg', 'ai'],
      default: 'ffmpeg'
    },
    provider: {
      type: String,
      default: 'ffmpeg',
      index: true
    },
    model: {
      type: String,
      default: 'ffmpeg-basic'
    },
    costCredits: {
      type: Number,
      default: 5
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const VideoProject = mongoose.model('VideoProject', videoProjectSchema);
