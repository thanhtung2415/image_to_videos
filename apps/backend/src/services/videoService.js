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
  const fps = 30;
  const totalFrames = duration * fps;
  const outputPath = path.join(generatedRoot, `video-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`);
  const motionFilter = [
    `scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase`,
    `crop=${width * 2}:${height * 2}`,
    `zoompan=z='min(zoom+0.0015,1.18)':x='iw/2-(iw/zoom/2)+sin(on/28)*18':y='ih/2-(ih/zoom/2)+cos(on/32)*12':d=${totalFrames}:s=${width}x${height}:fps=${fps}`,
    'format=yuv420p'
  ].join(',');

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1'])
      .outputOptions([
        `-t ${duration}`,
        `-vf ${motionFilter}`,
        `-r ${fps}`,
        '-movflags +faststart'
      ])
      .videoCodec('libx264')
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject);
  });
}
