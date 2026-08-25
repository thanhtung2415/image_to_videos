import { env } from '../../config/env.js';
import { BaseProviderAdapter } from './BaseProviderAdapter.js';

const providerAdapters = [
  new BaseProviderAdapter({
    name: 'fal',
    enabled: Boolean(env.providers.fal.apiKey),
    models: [
      {
        id: 'fal-image-to-video',
        label: 'fal.ai Image to Video',
        type: 'image-to-video',
        maxDuration: 5,
        defaultDuration: 5,
        supportedResolutions: ['provider_default'],
        native2K: false,
        upscale2K: true,
        baseCredits: 25,
        extraSecondCredits: 5
      }
    ]
  }),
  new BaseProviderAdapter({
    name: 'runway',
    enabled: Boolean(env.providers.runway.apiKey),
    models: [
      {
        id: 'runway-image-to-video',
        label: 'Runway Image to Video',
        type: 'image-to-video',
        maxDuration: 10,
        defaultDuration: 5,
        supportedResolutions: ['provider_default'],
        native2K: false,
        upscale2K: true,
        baseCredits: 35,
        extraSecondCredits: 7
      }
    ]
  }),
  new BaseProviderAdapter({
    name: 'luma',
    enabled: Boolean(env.providers.luma.apiKey),
    models: [
      {
        id: 'luma-image-to-video',
        label: 'Luma Image to Video',
        type: 'image-to-video',
        maxDuration: 5,
        defaultDuration: 5,
        supportedResolutions: ['provider_default'],
        native2K: false,
        upscale2K: true,
        baseCredits: 30,
        extraSecondCredits: 6
      }
    ]
  })
];

export function listProviders() {
  return providerAdapters.map((adapter) => ({
    name: adapter.name,
    enabled: adapter.enabled,
    models: adapter.getSupportedModels()
  }));
}

export function getProvider(name) {
  return providerAdapters.find((adapter) => adapter.name === name) || null;
}

export function getProviderForModel(modelId) {
  return providerAdapters.find((adapter) => adapter.getModelCapabilities(modelId)) || null;
}

export function estimateProviderCost({ provider, model, duration }) {
  const adapter = getProvider(provider);

  if (!adapter) {
    return null;
  }

  return adapter.estimateCost(model, { duration });
}

