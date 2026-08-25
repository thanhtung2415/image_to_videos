import express from 'express';
import { z } from 'zod';
import { AuditLog } from '../models/AuditLog.js';
import { ContentReport } from '../models/ContentReport.js';
import { Coupon } from '../models/Coupon.js';
import { GenerationJob } from '../models/GenerationJob.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { VideoProject } from '../models/VideoProject.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getCostSummary } from '../services/costService.js';
import { listProviderHealth } from '../services/providerHealthService.js';

export const adminRoutes = express.Router();

adminRoutes.use(requireAuth, requireAdmin);

const couponSchema = z.object({
  code: z.string().min(3).max(40),
  type: z.enum(['percent', 'fixed']).default('percent'),
  value: z.coerce.number().min(0),
  maxUses: z.coerce.number().min(0).default(0),
  expiresAt: z.string().datetime().optional()
});

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

adminRoutes.get('/provider-health', async (req, res, next) => {
  try {
    const health = await listProviderHealth();
    res.json({ health });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/cost-summary', async (req, res, next) => {
  try {
    const summary = await getCostSummary();
    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/coupons', async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(100);
    res.json({ coupons });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/content-reports', async (req, res, next) => {
  try {
    const reports = await ContentReport.find()
      .populate('reporter', 'name email')
      .populate('project', 'title status')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/coupons', async (req, res, next) => {
  try {
    const data = couponSchema.parse(req.body);
    const coupon = await Coupon.create({
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
    });

    res.status(201).json({ coupon });
  } catch (error) {
    next(error);
  }
});
