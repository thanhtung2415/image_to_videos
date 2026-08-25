import express from 'express';
import { z } from 'zod';
import { ContentReport } from '../models/ContentReport.js';
import { VideoProject } from '../models/VideoProject.js';
import { requireAuth } from '../middleware/auth.js';

export const contentRoutes = express.Router();

const reportSchema = z.object({
  projectId: z.string().min(12),
  reason: z.string().min(5).max(300)
});

contentRoutes.post('/reports', requireAuth, async (req, res, next) => {
  try {
    const data = reportSchema.parse(req.body);
    const project = await VideoProject.findById(data.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Khong tim thay project' });
    }

    const report = await ContentReport.create({
      reporter: req.user._id,
      project: project._id,
      reason: data.reason
    });

    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});

