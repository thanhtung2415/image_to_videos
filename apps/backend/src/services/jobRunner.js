import { GenerationJob } from '../models/GenerationJob.js';
import { VideoProject } from '../models/VideoProject.js';
import { captureReservedCredits, releaseReservedCredits } from './creditService.js';
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

    const outputPath = await createVideoFromImage({
      imagePath: job.project.sourceImage.path,
      duration: job.duration,
      resolution: job.resolution
    });

    await updateJob(job, { status: 'post_processing', progress: 70 });
    await updateJob(job, { status: 'uploading', progress: 85 });

    const uploaded = await uploadVideo(outputPath);

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

    await captureReservedCredits({
      userId: job.user,
      projectId: job.project._id,
      jobId: job._id,
      amount: job.costCredits,
      idempotencyKey: `capture:${job._id}`
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
  }
}
