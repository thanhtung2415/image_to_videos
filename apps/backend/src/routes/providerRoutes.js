import express from 'express';
import { listProviders } from '../services/providers/providerRouter.js';
import { listProviderHealth } from '../services/providerHealthService.js';

export const providerRoutes = express.Router();

providerRoutes.get('/', (req, res) => {
  res.json({
    resolutionRule:
      'Do phan giai toi da phu thuoc vao AI Provider, AI Model va goi dich vu duoc nguoi dung lua chon.',
    providers: listProviders()
  });
});

providerRoutes.get('/health', async (req, res, next) => {
  try {
    const health = await listProviderHealth();
    res.json({ health });
  } catch (error) {
    next(error);
  }
});
