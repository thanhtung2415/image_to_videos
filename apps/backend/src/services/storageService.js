import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { env, hasCloudinaryConfig } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads');

if (hasCloudinaryConfig()) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret
  });
}

export async function uploadVideo(videoPath) {
  if (hasCloudinaryConfig()) {
    const result = await cloudinary.uploader.upload(videoPath, {
      resource_type: 'video',
      folder: 'image-to-videos/generated'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  }

  const relativePath = path.relative(uploadsRoot, videoPath).replaceAll('\\', '/');

  return {
    url: `${env.publicBackendUrl}/media/${relativePath}`,
    publicId: ''
  };
}

export function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}
