import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/image_to_videos',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  publicBackendUrl: process.env.PUBLIC_BACKEND_URL || 'http://localhost:4000',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  }
};

export function hasCloudinaryConfig() {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

