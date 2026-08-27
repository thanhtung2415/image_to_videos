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

export async function uploadImage(imagePath) {
  if (hasCloudinaryConfig()) {
    const result = await cloudinary.uploader.upload(imagePath, {
      resource_type: 'image',
      folder: 'image-to-videos/source-images'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      storedInCloudinary: true
    };
  }

  const relativePath = path.relative(uploadsRoot, imagePath).replaceAll('\\', '/');

  return {
    url: `${env.publicBackendUrl}/media/${relativePath}`,
    publicId: '',
    storedInCloudinary: false
  };
}

export async function uploadRemoteVideo(videoUrl, fallbackPublicId = '') {
  if (hasCloudinaryConfig()) {
    const result = await cloudinary.uploader.upload(videoUrl, {
      resource_type: 'video',
      folder: 'image-to-videos/generated'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      storedInCloudinary: true
    };
  }

  return {
    url: videoUrl,
    publicId: fallbackPublicId,
    storedInCloudinary: false
  };
}

export async function cleanupOutputVideo({ filePath = '', publicId = '' } = {}) {
  const results = [];

  if (publicId && hasCloudinaryConfig()) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      results.push({ target: 'cloudinary', ok: true });
    } catch (error) {
      console.error('Cloudinary video cleanup failed', error);
      results.push({ target: 'cloudinary', ok: false, message: error.message });
    }
  }

  if (filePath) {
    try {
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadsRoot = path.resolve(uploadsRoot);
      const relativePath = path.relative(resolvedUploadsRoot, resolvedPath);

      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        results.push({ target: 'local', ok: false, message: 'Path is outside uploads directory' });
      } else if (fs.existsSync(resolvedPath)) {
        await fs.promises.unlink(resolvedPath);
        results.push({ target: 'local', ok: true });
      } else {
        results.push({ target: 'local', ok: true, message: 'File already missing' });
      }
    } catch (error) {
      console.error('Local video cleanup failed', error);
      results.push({ target: 'local', ok: false, message: error.message });
    }
  }

  return results;
}

export function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}
