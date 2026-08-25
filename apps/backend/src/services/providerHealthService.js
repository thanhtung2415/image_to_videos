import { ProviderHealth } from '../models/ProviderHealth.js';
import { listProviders } from './providers/providerRouter.js';

export async function refreshProviderHealth() {
  const providers = listProviders();
  const now = new Date();

  return Promise.all(
    providers.map((provider) =>
      ProviderHealth.findOneAndUpdate(
        { provider: provider.name },
        {
          provider: provider.name,
          enabled: provider.enabled,
          status: provider.enabled ? 'healthy' : 'disabled',
          latencyMs: provider.enabled ? 100 : 0,
          lastCheckedAt: now,
          lastError: ''
        },
        { upsert: true, new: true }
      )
    )
  );
}

export async function listProviderHealth() {
  await refreshProviderHealth();
  return ProviderHealth.find().sort({ provider: 1 });
}

