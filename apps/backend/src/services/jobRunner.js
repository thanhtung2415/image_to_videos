import { GenerationJob } from '../models/GenerationJob.js';
import { VideoProject } from '../models/VideoProject.js';
import { captureReservedCredits, releaseReservedCredits } from './creditService.js';
import { recordCostEvent } from './costService.js';
import { notifyUser } from './notificationService.js';
import { getProvider } from './providers/providerRouter.js';
import { uploadVideo } from './storageService.js';
import { createVideoFromImage } from './videoService.js';

async function updateJob(job, fields) {
  Object.assign(job, fields);
  await job.save();
  await VideoProject.findByIdAndUpdate(job.project, {
    status: fields.status,
    errorMessage: fields.errorMessage || ''
  });
}

export async function runGenerationJob(jobId) {
  const job = await GenerationJob.findById(jobId).populate('project');

  if (!job || !job.project || job.status !== 'queued') {
    return;
  }

  try {
    job.attemptCount += 1;
    job.startedAt = new Date();
    await updateJob(job, { status: 'processing', progress: 20 });

    let outputPath = '';
    let externalVideoUrl = '';

    if (job.provider === 'ffmpeg') {
      outputPath = await createVideoFromImage({
        imagePath: job.project.sourceImage.path,
        duration: job.duration,
        resolution: job.resolution
      });
    } else {
      const provider = getProvider(job.provider);

      if (!provider || !provider.enabled) {
        throw new Error('AI provider chua duoc cau hinh');
      }

      const generation = await provider.createGeneration({
        imagePath: job.project.sourceImage.path,
        mimeType: job.project.sourceImage.mimeType,
        prompt: job.project.prompt,
        duration: job.duration,
        resolution: job.resolution,
        model: job.model
      });

      job.providerGenerationId = generation.requestId || '';
      await job.save();
      externalVideoUrl = generation.videoUrl;

      if (!externalVideoUrl) {
        throw new Error('AI provider khong tra ve video URL');
      }
    }

    const latestJob = await GenerationJob.findById(job._id);

    if (!latestJob || latestJob.status === 'cancelled') {
      return;
    }

    await updateJob(job, { status: 'post_processing', progress: 70 });
    await updateJob(job, { status: 'uploading', progress: 85 });

    const uploaded = outputPath
      ? await uploadVideo(outputPath)
      : {
          url: externalVideoUrl,
          publicId: job.providerGenerationId
        };

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    await job.save();

    await VideoProject.findByIdAndUpdate(job.project._id, {
      status: 'completed',
      outputVideo: {
        url: uploaded.url,
        path: outputPath,
        publicId: uploaded.publicId,
        duration: job.duration,
        resolution: job.resolution
      },
      errorMessage: ''
    });

    await recordCostEvent({
      user: job.user,
      project: job.project._id,
      job: job._id,
      provider: job.provider,
      model: job.model,
      eventType: 'captured',
      credits: job.costCredits,
      metadata: {
        duration: job.duration,
        resolution: job.resolution
      }
    });

    await captureReservedCredits({
      userId: job.user,
      projectId: job.project._id,
      jobId: job._id,
      amount: job.costCredits,
      idempotencyKey: `capture:${job._id}`
    });

    await notifyUser({
      userId: job.user,
      type: 'VIDEO_COMPLETED',
      title: 'Video da tao xong',
      message: 'Video cua ban da san sang de xem va tai xuong.',
      metadata: {
        projectId: job.project._id,
        jobId: job._id
      }
    });
  } catch (error) {
    job.failedAt = new Date();
    await updateJob(job, {
      status: 'failed',
      progress: 100,
      errorMessage: error.message || 'Tao video that bai'
    });
    await releaseReservedCredits({
      userId: job.user,
      projectId: job.project._id,
      jobId: job._id,
      amount: job.costCredits,
      idempotencyKey: `release:${job._id}`,
      note: error.message || 'Generation failed'
    });

    await recordCostEvent({
      user: job.user,
      project: job.project._id,
      job: job._id,
      provider: job.provider,
      model: job.model,
      eventType: 'failed',
      credits: job.costCredits,
      metadata: {
        error: error.message
      }
    });

    await notifyUser({
      userId: job.user,
      type: 'VIDEO_FAILED',
      title: 'Tao video that bai',
      message: 'He thong da hoan lai credit da reserve cho job nay.',
      metadata: {
        projectId: job.project._id,
        jobId: job._id,
        error: error.message
      }
    });
  }
}
