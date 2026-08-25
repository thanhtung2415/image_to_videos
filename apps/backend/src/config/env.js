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
      apiKey: process.env.FAL_API_KEY || ''
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
  }
};

export function hasCloudinaryConfig() {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

export function shouldUseRedisQueue() {
  return env.queueMode === 'redis' && Boolean(env.redisUrl);
}
