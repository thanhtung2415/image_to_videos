import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env, shouldUseRedisQueue } from '../config/env.js';
import { runGenerationJob } from './jobRunner.js';

export const GENERATION_QUEUE_NAME = 'video-generation';

let queue;
let connection;

function getConnection() {
  if (!connection) {
    connection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null
    });
  }

  return connection;
}

export function getGenerationQueue() {
  if (!shouldUseRedisQueue()) {
    return null;
  }

  if (!queue) {
    queue = new Queue(GENERATION_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });
  }

  return queue;
}

export async function enqueueGeneration(jobId) {
  const queueInstance = getGenerationQueue();

  if (!queueInstance) {
    setTimeout(() => runGenerationJob(jobId).catch(console.error), 100);
    return {
      mode: 'local',
      queueJobId: ''
    };
  }

  const queueJob = await queueInstance.add(
    'generate-video',
    { generationJobId: jobId.toString() },
    { jobId: jobId.toString() }
  );

  return {
    mode: 'redis',
    queueJobId: queueJob.id
  };
}

