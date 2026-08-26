import { BaseProviderAdapter } from './BaseProviderAdapter.js';
import { uploadImage } from '../storageService.js';

const MINIMAX_VIDEO_MODEL = 'minimax/video-01';
const MINIMAX_VIDEO_VERSION = '5aa835260ff7f40f4069c41185f72036accf99e29957bb4a3b3a911f3b6c1912';
const REPLICATE_API_URL = 'https://api.replicate.com/v1';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatReplicateError(error) {
  const detail = error?.detail || error?.message;

  if (typeof detail === 'string') {
    return `Replicate: ${detail}`;
  }

  return 'Replicate generation failed';
}

function findVideoUrl(output) {
  if (!output) {
    return '';
  }

  if (typeof output === 'string') {
    return output;
  }

  if (Array.isArray(output)) {
    return output.find((item) => typeof item === 'string' && item.includes('.mp4')) || output[0] || '';
  }

  if (typeof output === 'object') {
    return output.url || output.video || output.output || '';
  }

  return '';
}

export class ReplicateProviderAdapter extends BaseProviderAdapter {
  constructor({ apiToken, minimaxVersion }) {
    super({
      name: 'replicate',
      enabled: Boolean(apiToken),
      models: [
        {
          id: MINIMAX_VIDEO_MODEL,
          label: 'Replicate Minimax Video-01',
          type: 'image-to-video',
          maxDuration: 6,
          defaultDuration: 5,
          supportedResolutions: ['provider_default'],
          native2K: false,
          upscale2K: true,
          baseCredits: 20,
          extraSecondCredits: 5
        }
      ]
    });
    this.apiToken = apiToken;
    this.minimaxVersion = minimaxVersion || MINIMAX_VIDEO_VERSION;
  }

  async request(path, options = {}) {
    if (!this.apiToken) {
      throw new Error('REPLICATE_API_TOKEN chua duoc cau hinh');
    }

    const response = await fetch(`${REPLICATE_API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(formatReplicateError(data));
    }

    return data;
  }

  async createGeneration({ imagePath, prompt, onStatus }) {
    try {
      const uploadedImage = await uploadImage(imagePath);
      const prediction = await this.request('/predictions', {
        method: 'POST',
        body: JSON.stringify({
          version: this.minimaxVersion,
          input: {
            prompt,
            first_frame_image: uploadedImage.url,
            prompt_optimizer: true
          }
        })
      });

      await onStatus?.({
        requestId: prediction.id,
        status: prediction.status
      });

      let status = prediction;

      while (!['succeeded', 'failed', 'canceled'].includes(status.status)) {
        await sleep(5000);
        status = await this.request(`/predictions/${prediction.id}`);
        await onStatus?.({
          requestId: prediction.id,
          status: status.status,
          logs: status.logs ? [status.logs] : []
        });
      }

      if (status.status !== 'succeeded') {
        throw new Error(status.error || `Replicate generation ${status.status}`);
      }

      return {
        requestId: status.id,
        videoUrl: findVideoUrl(status.output),
        raw: status
      };
    } catch (error) {
      throw new Error(formatReplicateError(error));
    }
  }
}
