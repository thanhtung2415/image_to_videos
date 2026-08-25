import express from 'express';
import { z } from 'zod';
import { GenerationJob } from '../models/GenerationJob.js';
import { User } from '../models/User.js';
import { VideoProject } from '../models/VideoProject.js';
import { requireAuth } from '../middleware/auth.js';
import { imageUpload } from '../middleware/upload.js';
import { env } from '../config/env.js';
import { enqueueGeneration } from '../services/jobRunner.js';

export const projectRoutes = express.Router();

const createProjectSchema = z.object({
  title: z.string().min(2).max(120),
  prompt: z.string().max(600).optional().default(''),
  duration: z.coerce.number().min(3).max(10).default(5),
  resolution: z.enum(['1280x720', '720x1280', '1024x1024']).default('1280x720')
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
    const costCredits = 5;
    const freshUser = await User.findById(req.user._id);

    if (freshUser.creditWallet.availableCredit < costCredits) {
      return res.status(402).json({ message: 'Khong du credit de tao video' });
    }

    freshUser.creditWallet.availableCredit -= costCredits;
    freshUser.creditWallet.lifetimeUsed += costCredits;
    await freshUser.save();

    const project = await VideoProject.create({
      user: req.user._id,
      title: data.title,
      prompt: data.prompt,
      status: 'queued',
      costCredits,
      sourceImage: {
        url: `${env.publicBackendUrl}/media/assets/${req.file.filename}`,
        path: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });

    const job = await GenerationJob.create({
      project: project._id,
      user: req.user._id,
      duration: data.duration,
      resolution: data.resolution,
      costCredits,
      status: 'queued'
    });

    enqueueGeneration(job._id);

    res.status(201).json({ project, job });
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

