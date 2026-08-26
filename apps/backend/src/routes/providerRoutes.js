import express from 'express';
import { listProviders } from '../services/providers/providerRouter.js';
import { listProviderHealth } from '../services/providerHealthService.js';
import { getSystemSettings } from '../services/settingService.js';

export const providerRoutes = express.Router();

providerRoutes.get('/', async (req, res, next) => {
  try {
    const settings = await getSystemSettings();

    res.json({
      defaultProvider: settings.provider.default,
      resolutionRule:
        'Do phan giai toi da phu thuoc vao AI Provider, AI Model va goi dich vu duoc nguoi dung lua chon.',
      providers: listProviders()
    });
  } catch (error) {
    next(error);
  }
});

providerRoutes.get('/health', async (req, res, next) => {
  try {
    const health = await listProviderHealth();
    res.json({ health });
  } catch (error) {
    next(error);
  }
});
