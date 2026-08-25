import express from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { ContentReport } from '../models/ContentReport.js';
import { GenerationJob } from '../models/GenerationJob.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { VideoProject } from '../models/VideoProject.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const adminRoutes = express.Router();

adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.get('/overview', async (req, res, next) => {
  try {
    const [users, projects, jobs, payments, reports] = await Promise.all([
      User.countDocuments(),
      VideoProject.countDocuments(),
      GenerationJob.countDocuments(),
      Payment.countDocuments(),
      ContentReport.countDocuments({ status: { $in: ['open', 'reviewing'] } })
    ]);

    res.json({
      overview: {
        users,
        projects,
        jobs,
        payments,
        openReports: reports
      }
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

