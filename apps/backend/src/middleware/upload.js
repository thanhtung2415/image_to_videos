import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, '../../uploads/assets');

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadRoot,
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

export const imageUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new Error('Chi ho tro JPG, PNG hoac WEBP'));
    }

    callback(null, true);
  }
});
