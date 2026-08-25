import fs from 'fs/promises';
import path from 'path';
import { File } from 'buffer';
import { fal } from '@fal-ai/client';
import { BaseProviderAdapter } from './BaseProviderAdapter.js';

const FAL_FLUX_IMAGE_TO_VIDEO = 'blackforestlabs/flux-3/image-to-video';

function mapAspectRatio(resolution) {
  if (resolution === '720x1280') {
    return '9:16';
  }

  if (resolution === '1024x1024') {
    return '1:1';
  }

  return '16:9';
}

function mapDuration(duration) {
  const normalized = Math.max(5, Math.min(20, Number(duration || 5)));
  return String(normalized);
}

function mapResolution(resolution) {
  return resolution === '1024x1024' ? '720p' : '720p';
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class FalProviderAdapter extends BaseProviderAdapter {
  constructor({ apiKey }) {
    super({
      name: 'fal',
      enabled: Boolean(apiKey),
      models: [
        {
          id: FAL_FLUX_IMAGE_TO_VIDEO,
          label: 'fal.ai FLUX 3 Image to Video',
          type: 'image-to-video',
          maxDuration: 20,
          defaultDuration: 5,
          supportedResolutions: ['720p', '1080p'],
          native2K: false,
          upscale2K: true,
          baseCredits: 25,
          extraSecondCredits: 5
        }
      ]
    });
    this.apiKey = apiKey;
  }

  configure() {
    if (!this.apiKey) {
      throw new Error('FAL_API_KEY chua duoc cau hinh');
    }

    fal.config({
      credentials: this.apiKey
    });
  }

  async uploadImage({ imagePath, mimeType }) {
    this.configure();
    const buffer = await fs.readFile(imagePath);
    const file = new File([buffer], path.basename(imagePath), {
      type: mimeType || 'image/png'
    });

    return fal.storage.upload(file);
  }

  async createGeneration({ imagePath, mimeType, prompt, duration, resolution, onStatus }) {
    this.configure();
    const imageUrl = await this.uploadImage({ imagePath, mimeType });
    const { request_id: requestId } = await fal.queue.submit(FAL_FLUX_IMAGE_TO_VIDEO, {
      input: {
        prompt,
        image_url: imageUrl,
        aspect_ratio: mapAspectRatio(resolution),
        resolution: mapResolution(resolution),
        duration: mapDuration(duration),
        generate_audio: false,
        safety_tolerance: 2
      }
    });

    await onStatus?.({
      requestId,
      status: 'SUBMITTED'
    });

    let status = await fal.queue.status(FAL_FLUX_IMAGE_TO_VIDEO, {
      requestId,
      logs: true
    });

    while (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(status.status)) {
      await onStatus?.({
        requestId,
        status: status.status,
        logs: status.logs || []
      });
      await sleep(5000);
      status = await fal.queue.status(FAL_FLUX_IMAGE_TO_VIDEO, {
        requestId,
        logs: true
      });
    }

    if (status.status !== 'COMPLETED') {
      throw new Error(`fal.ai generation ${status.status.toLowerCase()}`);
    }

    const result = await fal.queue.result(FAL_FLUX_IMAGE_TO_VIDEO, {
      requestId
    });

    return {
      requestId: result.requestId || requestId,
      videoUrl: result.data?.video?.url,
      raw: result.data
    };
  }
}
