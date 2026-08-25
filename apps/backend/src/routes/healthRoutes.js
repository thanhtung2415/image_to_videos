import express from 'express';
import { getDatabaseStatus } from '../config/database.js';
import { hasCloudinaryConfig, shouldUseRedisQueue } from '../config/env.js';
import { getGenerationQueue } from '../services/queueService.js';
import { listProviders } from '../services/providers/providerRouter.js';

export const healthRoutes = express.Router();

healthRoutes.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'image-to-videos-api'
  });
});

healthRoutes.get('/ready', async (req, res) => {
  const database = getDatabaseStatus();
  const queue = {
    mode: shouldUseRedisQueue() ? 'redis' : 'local',
    ready: true
  };

  if (shouldUseRedisQueue()) {
    try {
      const queueInstance = getGenerationQueue();
      await queueInstance.client;
    } catch (error) {
      queue.ready = false;
      queue.error = error.message;
    }
  }

  const readiness = {
    database,
    queue,
    storage: {
      cloudinaryConfigured: hasCloudinaryConfig()
    },
    providers: listProviders().map((provider) => ({
      name: provider.name,
      enabled: provider.enabled
    }))
  };

  const ready = database.connected && queue.ready;

  res.status(ready ? 200 : 503).json({
    ready,
    readiness
  });
});

