import { Setting } from '../models/Setting.js';
import { estimateProviderCost } from './providers/providerRouter.js';

const VIDEO_COSTS_KEY = 'video_costs';

const defaultVideoCosts = {
  ffmpegBaseCredits: 5,
  aiDefaultBaseCredits: 20,
  extraSecondCredits: 5,
  modelCredits: {
    'replicate:minimax/video-01': 20,
    'fal:blackforestlabs/flux-3/image-to-video': 25,
    'runway:runway-image-to-video': 35,
    'luma:luma-image-to-video': 30
  }
};

export async function getVideoCostSettings() {
  const setting = await Setting.findOneAndUpdate(
    { key: VIDEO_COSTS_KEY },
    { $setOnInsert: { key: VIDEO_COSTS_KEY, value: defaultVideoCosts } },
    { new: true, upsert: true }
  );

  return {
    ...defaultVideoCosts,
    ...(setting.value || {}),
    modelCredits: {
      ...defaultVideoCosts.modelCredits,
      ...(setting.value?.modelCredits || {})
    }
  };
}

export async function updateVideoCostSettings(value) {
  const current = await getVideoCostSettings();
  const next = {
    ...current,
    ...value,
    modelCredits: {
      ...current.modelCredits,
      ...(value.modelCredits || {})
    }
  };

  await Setting.findOneAndUpdate(
    { key: VIDEO_COSTS_KEY },
    { key: VIDEO_COSTS_KEY, value: next },
    { new: true, upsert: true, runValidators: true }
  );

  return next;
}

export async function estimateVideoCost({ generationMode, provider, model, duration }) {
  const settings = await getVideoCostSettings();

  if (generationMode === 'ffmpeg') {
    return settings.ffmpegBaseCredits;
  }

  const configured = settings.modelCredits[`${provider}:${model}`];

  if (configured) {
    return configured + Math.max(0, Number(duration || 5) - 5) * settings.extraSecondCredits;
  }

  return estimateProviderCost({ provider, model, duration }) || settings.aiDefaultBaseCredits;
}
