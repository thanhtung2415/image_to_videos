import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { connectDatabase } from './config/database.js';
import { env, shouldUseRedisQueue } from './config/env.js';
import { GENERATION_QUEUE_NAME } from './services/queueService.js';
import { runGenerationJob } from './services/jobRunner.js';

async function startWorker() {
  if (!shouldUseRedisQueue()) {
    console.log('Worker disabled. Set QUEUE_MODE=redis and REDIS_URL to enable BullMQ worker.');
    return;
  }

  await connectDatabase();

  const connection = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null
  });

  const worker = new Worker(
    GENERATION_QUEUE_NAME,
    async (job) => {
      await runGenerationJob(job.data.generationJobId);
    },
    {
      connection,
      concurrency: 2,
      lockDuration: 120000
    }
  );

  worker.on('completed', (job) => {
    console.log(`Generation queue job completed: ${job.id}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Generation queue job failed: ${job?.id}`, error);
  });

  console.log('Video generation worker started');
}

startWorker().catch((error) => {
  console.error('Cannot start worker', error);
  process.exit(1);
});

