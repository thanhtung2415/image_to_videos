import express from 'express';
import fs from 'fs/promises';
import { z } from 'zod';
import { GenerationJob } from '../models/GenerationJob.js';
import { VideoProject } from '../models/VideoProject.js';
import { requireAuth } from '../middleware/auth.js';
import { imageUpload } from '../middleware/upload.js';
import { env } from '../config/env.js';
import { cancelQueuedGeneration, enqueueGeneration } from '../services/queueService.js';
import { releaseReservedCredits, reserveCredits } from '../services/creditService.js';
import { getProvider } from '../services/providers/providerRouter.js';
import { estimateVideoCost, getSystemSettings } from '../services/settingService.js';
import { notifyUser } from '../services/notificationService.js';
import { moderateProjectInput } from '../services/moderationService.js';
import { writeAuditLog } from '../services/auditService.js';

export const projectRoutes = express.Router();

const createProjectSchema = z.object({
  title: z.string().min(2).max(120),
  prompt: z.string().max(600).optional().default(''),
  duration: z.coerce.number().min(3).max(10).default(5),
  resolution: z.enum(['1280x720', '720x1280', '1024x1024']).default('1280x720'),
  generationMode: z.enum(['ffmpeg', 'ai']).default('ffmpeg'),
  provider: z.string().max(40).optional().default('ffmpeg'),
  model: z.string().max(160).optional().default('ffmpeg-basic')
});

projectRoutes.use(requireAuth);

projectRoutes.get('/', async (req, res, next) => {
  try {
    const projects = await VideoProject.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

projectRoutes.post('/', imageUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui long tai len mot anh' });
    }

    const data = createProjectSchema.parse(req.body);
    const systemSettings = await getSystemSettings();
    const maxFileSizeMb = Number(systemSettings.upload?.maxFileSizeMb || 5);
    const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

    if (req.file.size > maxFileSizeBytes) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: `Anh toi da ${maxFileSizeMb}MB` });
    }

    const moderation = moderateProjectInput({ prompt: data.prompt, file: req.file });

    if (!moderation.ok) {
      return res.status(400).json({ message: moderation.message });
    }

    const providerName = data.generationMode === 'ai' ? data.provider : 'ffmpeg';
    const modelName = data.generationMode === 'ai' ? data.model : 'ffmpeg-basic';
    const provider = data.generationMode === 'ai' ? getProvider(providerName) : null;

    if (data.generationMode === 'ai' && (!provider || !provider.enabled)) {
      return res.status(400).json({ message: 'AI provider chua duoc cau hinh API key' });
    }

    const providerCost = await estimateVideoCost({
      generationMode: data.generationMode,
      provider: providerName,
      model: modelName,
      duration: data.duration
    });

    if (!providerCost) {
      return res.status(400).json({ message: 'AI model khong hop le' });
    }

    const costCredits = providerCost;
    const project = await VideoProject.create({
      user: req.user._id,
      title: data.title,
      prompt: data.prompt,
      status: 'queued',
      generationMode: data.generationMode,
      provider: providerName,
      model: modelName,
      costCredits,
      sourceImage: {
        url: `${env.publicBackendUrl}/media/assets/${req.file.filename}`,
        path: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });

    const reservation = await reserveCredits({
      userId: req.user._id,
      projectId: project._id,
      amount: costCredits,
      idempotencyKey: `reserve:${project._id}`
    });

    if (!reservation.ok) {
      project.status = 'failed';
      project.errorMessage = reservation.message;
      await project.save();
      return res.status(402).json({ message: reservation.message });
    }

    let job;

    try {
      job = await GenerationJob.create({
        project: project._id,
        user: req.user._id,
        duration: data.duration,
        resolution: data.resolution,
        provider: providerName,
        model: modelName,
        costCredits,
        status: 'queued'
      });

      const queueInfo = await enqueueGeneration(job._id);
      job.queueMode = queueInfo.mode;
      job.queueJobId = queueInfo.queueJobId;
      await job.save();
    } catch (enqueueError) {
      project.status = 'failed';
      project.errorMessage = 'Khong the dua video vao hang doi xu ly';
      await project.save();

      if (job) {
        job.status = 'failed';
        job.errorMessage = enqueueError.message;
        job.failedAt = new Date();
        await job.save();
      }

      await releaseReservedCredits({
        userId: req.user._id,
        projectId: project._id,
        jobId: job?._id,
        amount: costCredits,
        idempotencyKey: `enqueue-release:${project._id}`,
        note: 'Release credits because enqueue failed'
      });

      return res.status(500).json({ message: 'Khong the dua video vao hang doi xu ly' });
    }

    await notifyUser({
      userId: req.user._id,
      type: 'VIDEO_QUEUED',
      title: 'Video da vao hang doi',
      message: 'He thong dang xu ly video cua ban trong nen.',
      metadata: {
        projectId: project._id,
        jobId: job._id
      }
    });

    await writeAuditLog({
      actor: req.user._id,
      action: 'project.create',
      resourceType: 'VideoProject',
      resourceId: project._id.toString(),
      req,
      metadata: {
        generationMode: data.generationMode,
        provider: providerName,
        model: modelName
      }
    });

    res.status(201).json({ project, job });
  } catch (error) {
    next(error);
  }
});

projectRoutes.post('/:id/cancel', async (req, res, next) => {
  try {
    const project = await VideoProject.findOne({ _id: req.params.id, user: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Khong tim thay project' });
    }

    if (!['queued', 'processing', 'post_processing', 'uploading'].includes(project.status)) {
      return res.status(400).json({ message: 'Project khong the huy o trang thai hien tai' });
    }

    const job = await GenerationJob.findOne({ project: project._id }).sort({ createdAt: -1 });

    if (!job) {
      return res.status(404).json({ message: 'Khong tim thay generation job' });
    }

    const queueCancelResult = await cancelQueuedGeneration(job.queueJobId);

    project.status = 'cancelled';
    project.errorMessage = 'User cancelled generation';
    await project.save();

    job.status = 'cancelled';
    job.progress = 100;
    job.errorMessage = 'User cancelled generation';
    job.completedAt = new Date();
    await job.save();

    const wallet = await releaseReservedCredits({
      userId: req.user._id,
      projectId: project._id,
      jobId: job._id,
      amount: job.costCredits,
      idempotencyKey: `cancel-release:${job._id}`,
      note: 'User cancelled generation'
    });

    await notifyUser({
      userId: req.user._id,
      type: 'VIDEO_CANCELLED',
      title: 'Video da duoc huy',
      message: 'Credit reserve da duoc hoan ve vi cua ban.',
      metadata: {
        projectId: project._id,
        jobId: job._id,
        queueCancelResult
      }
    });

    await writeAuditLog({
      actor: req.user._id,
      action: 'project.cancel',
      resourceType: 'VideoProject',
      resourceId: project._id.toString(),
      req,
      metadata: {
        jobId: job._id,
        queueCancelResult
      }
    });

    res.json({ project, job, wallet: wallet?.creditWallet || req.user.creditWallet });
  } catch (error) {
    next(error);
  }
});

projectRoutes.get('/:id/events', async (req, res, next) => {
  try {
    const project = await VideoProject.findOne({ _id: req.params.id, user: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Khong tim thay project' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let closed = false;
    let timer;
    req.on('close', () => {
      closed = true;
      if (timer) {
        clearInterval(timer);
      }
    });

    const sendStatus = async () => {
      if (closed) {
        return;
      }

      const latestProject = await VideoProject.findById(project._id);
      const latestJob = await GenerationJob.findOne({ project: project._id }).sort({ createdAt: -1 });

      res.write(`event: status\n`);
      res.write(`data: ${JSON.stringify({ project: latestProject, job: latestJob })}\n\n`);

      if (['completed', 'failed', 'cancelled'].includes(latestProject.status)) {
        clearInterval(timer);
        res.end();
      }
    };

    timer = setInterval(() => {
      sendStatus().catch((error) => {
        clearInterval(timer);
        next(error);
      });
    }, 3000);

    await sendStatus();
  } catch (error) {
    next(error);
  }
});

projectRoutes.get('/:id', async (req, res, next) => {
  try {
    const project = await VideoProject.findOne({ _id: req.params.id, user: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Khong tim thay project' });
    }

    const job = await GenerationJob.findOne({ project: project._id }).sort({ createdAt: -1 });
    res.json({ project, job });
  } catch (error) {
    next(error);
  }
});
