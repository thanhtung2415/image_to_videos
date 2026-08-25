import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { fileURLToPath } from 'url';
import { ensureDirectory } from './storageService.js';

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatedRoot = path.resolve(__dirname, '../../uploads/generated');

export function createVideoFromImage({ imagePath, duration = 5, resolution = '1280x720' }) {
  ensureDirectory(generatedRoot);

  const [width, height] = resolution.split('x').map(Number);
  const outputPath = path.join(generatedRoot, `video-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1'])
      .outputOptions([
        `-t ${duration}`,
        `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`,
        '-r 30',
        '-movflags +faststart'
      ])
      .videoCodec('libx264')
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject);
  });
}
