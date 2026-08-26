import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/image_to_videos',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  adminEmails: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  publicBackendUrl: process.env.PUBLIC_BACKEND_URL || 'http://localhost:4000',
  redisUrl: process.env.REDIS_URL || '',
  queueMode: process.env.QUEUE_MODE || 'local',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  providers: {
    fal: {
      apiKey: process.env.FAL_API_KEY || process.env.FAL_KEY || ''
    },
    replicate: {
      apiToken: process.env.REPLICATE_API_TOKEN || '',
      minimaxVersion: process.env.REPLICATE_MINIMAX_VIDEO_VERSION || ''
    },
    runway: {
      apiKey: process.env.RUNWAY_API_KEY || ''
    },
    luma: {
      apiKey: process.env.LUMA_API_KEY || ''
    }
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'mock',
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'dev_webhook_secret'
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'no-reply@image-to-videos.local'
  }
};

export function hasCloudinaryConfig() {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

export function shouldUseRedisQueue() {
  return env.queueMode === 'redis' && Boolean(env.redisUrl);
}
