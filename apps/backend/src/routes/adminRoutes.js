import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AuditLog } from '../models/AuditLog.js';
import { ContentReport } from '../models/ContentReport.js';
import { Coupon } from '../models/Coupon.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { GenerationJob } from '../models/GenerationJob.js';
import { Payment } from '../models/Payment.js';
import { PricingPlan } from '../models/PricingPlan.js';
import { Promotion } from '../models/Promotion.js';
import { PromotionRegistration } from '../models/PromotionRegistration.js';
import { User } from '../models/User.js';
import { VideoProject } from '../models/VideoProject.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getCostSummary } from '../services/costService.js';
import { adjustCredits } from '../services/creditService.js';
import { listProviderHealth } from '../services/providerHealthService.js';
import { seedDefaultPricingPlans } from '../services/pricingService.js';
import {
  getSystemSettings,
  getVideoCostSettings,
  updateSystemSettings,
  updateVideoCostSettings
} from '../services/settingService.js';
import { writeAuditLog } from '../services/auditService.js';
import { canDeleteVideo, softDeleteVideo } from '../services/videoDeletionService.js';

export const adminRoutes = express.Router();

adminRoutes.use(requireAuth, requireAdmin);

const couponSchema = z.object({
  code: z.string().min(3).max(40),
  type: z.enum(['percent', 'fixed']).default('percent'),
  value: z.coerce.number().min(0),
  maxUses: z.coerce.number().min(0).default(0),
  expiresAt: z.string().datetime().optional()
});

const userUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  fullName: z.string().min(2).max(80).optional(),
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'locked']).optional()
});

const creditAdjustmentSchema = z.object({
  amount: z.coerce.number().int().refine((value) => value !== 0, 'Amount must not be zero'),
  reason: z.string().max(200).default('')
});

const creditTransactionTypes = [
  'purchase',
  'reserve',
  'capture',
  'release',
  'refund',
  'manual_adjustment',
  'promotion_bonus'
];

const contentReportUpdateSchema = z.object({
  status: z.enum(['open', 'reviewing', 'resolved', 'dismissed'])
});

const promotionBaseSchema = z.object({
  name: z.string().min(3).max(120),
  code: z.string().min(3).max(40),
  description: z.string().max(300).default(''),
  creditBonus: z.coerce.number().int().min(1).optional(),
  bonusCredit: z.coerce.number().int().min(1).optional(),
  maxRegistrations: z.coerce.number().int().min(0).default(0),
  startsAt: z.string().datetime().optional(),
  startAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'expired']).default('active'),
  conditions: z.string().max(300).default('One registration per user')
});

const promotionSchema = promotionBaseSchema
  .refine((value) => value.creditBonus || value.bonusCredit, 'bonusCredit is required')
  .refine((value) => value.startsAt || value.startAt, 'startAt is required')
  .refine((value) => value.endsAt || value.endAt, 'endAt is required');

const promotionUpdateSchema = promotionBaseSchema.partial();

const pricingPlanSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  credits: z.coerce.number().int().min(0),
  price: z.coerce.number().min(0),
  currency: z.string().min(3).max(3).default('VND'),
  active: z.coerce.boolean().default(true),
  status: z.enum(['active', 'inactive']).optional(),
  sortOrder: z.coerce.number().int().default(0)
});

const pricingPlanUpdateSchema = pricingPlanSchema.partial();

const videoCostSchema = z.object({
  ffmpegBaseCredits: z.coerce.number().int().min(0).optional(),
  aiDefaultBaseCredits: z.coerce.number().int().min(0).optional(),
  extraSecondCredits: z.coerce.number().int().min(0).optional(),
  modelCredits: z.record(z.string(), z.coerce.number().int().min(0)).optional()
});

const adminDeleteVideoSchema = z.object({
  reason: z.string().max(240).optional().default('Admin delete')
});

const statusSchema = z.object({
  status: z.enum(['active', 'locked', 'draft', 'inactive', 'expired'])
});

const systemSettingsSchema = z.object({
  videoGeneration: z.object({
    ffmpegBaseCredit: z.coerce.number().int().min(0).optional(),
    aiBaseCredit: z.coerce.number().int().min(0).optional(),
    extraSecondCredit: z.coerce.number().int().min(0).optional(),
    modelCredits: z.record(z.string(), z.coerce.number().int().min(0)).optional()
  }).optional(),
  upload: z.object({
    maxFileSizeMb: z.coerce.number().int().min(1).max(100).optional()
  }).optional(),
  provider: z.object({
    default: z.enum(['ffmpeg', 'replicate', 'fal', 'runway', 'luma']).optional()
  }).optional()
});

function dateRangeFromQuery(req) {
  const days = Math.min(365, Math.max(1, Number(req.query.days || 30)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return { days, since };
}

function queryDateRange(req) {
  const match = {};

  if (req.query.from || req.query.to) {
    match.createdAt = {};

    if (req.query.from) {
      match.createdAt.$gte = new Date(String(req.query.from));
    }

    if (req.query.to) {
      const to = new Date(String(req.query.to));
      to.setHours(23, 59, 59, 999);
      match.createdAt.$lte = to;
    }
  }

  return match;
}

function adminUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    creditWallet: user.creditWallet,
    createdAt: user.createdAt
  };
}

function promotionPayload(data, actorId) {
  const bonus = data.creditBonus || data.bonusCredit;
  const start = data.startsAt || data.startAt;
  const end = data.endsAt || data.endAt;
  const payload = {
    ...data,
    ...(data.code ? { code: data.code.toUpperCase() } : {}),
    ...(bonus ? { creditBonus: bonus, bonusCredit: bonus } : {}),
    ...(start ? { startsAt: new Date(start), startAt: new Date(start) } : {}),
    ...(end ? { endsAt: new Date(end), endAt: new Date(end) } : {})
  };

  if (actorId) {
    payload.createdBy = actorId;
  }

  delete payload.startAt;
  delete payload.endAt;
  delete payload.bonusCredit;

  return {
    ...payload,
    ...(bonus ? { bonusCredit: bonus } : {}),
    ...(start ? { startAt: new Date(start) } : {}),
    ...(end ? { endAt: new Date(end) } : {})
  };
}

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

adminRoutes.get('/users', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const filter = { status: { $ne: 'deleted' } };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.query.status) {
      filter.status = String(req.query.status);
    }

    if (req.query.role) {
      filter.role = String(req.query.role);
    }

    const [users, total] = await Promise.all([
      User.find(filter)
      .select('-passwordHash -emailVerificationTokenHash -passwordResetTokenHash')
      .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({ users: users.map(adminUser), pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/users/:id', async (req, res, next) => {
  try {
    const [user, transactions, projects] = await Promise.all([
      User.findById(req.params.id).select('-passwordHash -emailVerificationTokenHash -passwordResetTokenHash'),
      CreditTransaction.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(20),
      VideoProject.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(10)
    ]);

    if (!user || user.status === 'deleted') {
      return res.status(404).json({ message: 'Khong tim thay user' });
    }

    res.json({ user: adminUser(user), transactions, projects });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/users/:id', async (req, res, next) => {
  try {
    const data = userUpdateSchema.parse(req.body);
    const update = {
      ...data,
      ...(data.fullName ? { name: data.fullName } : {})
    };
    delete update.fullName;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'deleted' } },
      update,
      { new: true, runValidators: true }
    ).select('-passwordHash -emailVerificationTokenHash -passwordResetTokenHash');

    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay user' });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_user',
      resourceType: 'User',
      resourceId: user._id.toString(),
      req,
      metadata: update
    });

    res.json({ user: adminUser(user) });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/users/:id/status', async (req, res, next) => {
  try {
    const data = statusSchema.parse(req.body);

    if (!['active', 'locked'].includes(data.status)) {
      return res.status(400).json({ message: 'Trang thai user khong hop le' });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'deleted' } },
      { status: data.status },
      { new: true, runValidators: true }
    ).select('-passwordHash -emailVerificationTokenHash -passwordResetTokenHash');

    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay user' });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_user_status',
      resourceType: 'User',
      resourceId: user._id.toString(),
      req,
      metadata: data
    });

    res.json({ user: adminUser(user) });
  } catch (error) {
    next(error);
  }
});

async function handleCreditAdjustment(req, res, next) {
  try {
    const data = creditAdjustmentSchema.parse(req.body);
    const result = await adjustCredits({
      userId: req.params.id,
      adminId: req.user._id,
      delta: data.amount,
      reason: data.reason,
      idempotencyKey: req.body.idempotencyKey || `admin-credit:${req.user._id}:${req.params.id}:${Date.now()}`
    });

    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.adjust_credit',
      resourceType: 'User',
      resourceId: req.params.id,
      req,
      metadata: data
    });

    res.json({ user: adminUser(result.user) });
  } catch (error) {
    next(error);
  }
}

adminRoutes.post('/users/:id/credits', handleCreditAdjustment);
adminRoutes.post('/users/:id/credits/adjust', handleCreditAdjustment);

adminRoutes.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/credit-transactions', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const filter = { ...queryDateRange(req) };
    const type = String(req.query.type || '').trim();
    const userId = String(req.query.userId || '').trim();

    if (type) {
      if (!creditTransactionTypes.includes(type)) {
        return res.status(400).json({ message: 'Loai giao dich credit khong hop le' });
      }

      filter.type = type;
    }

    if (userId) {
      if (!/^[a-f\d]{24}$/i.test(userId)) {
        return res.status(400).json({ message: 'User id khong hop le' });
      }

      filter.user = userId;
    }

    const [transactions, total] = await Promise.all([
      CreditTransaction.find(filter)
        .populate('user', 'name email role status')
        .populate('admin', 'name email')
        .populate('project', 'title status')
        .populate('job', 'status providerGenerationId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CreditTransaction.countDocuments(filter)
    ]);

    res.json({ transactions, pagination: { page, limit, total } });
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

adminRoutes.get('/reports/overview', async (req, res, next) => {
  try {
    const createdRange = queryDateRange(req);
    const paymentRange = createdRange.createdAt
      ? { paidAt: createdRange.createdAt }
      : {};
    const [
      totalUsers,
      newUsers,
      totalVideos,
      completedVideos,
      failedVideos,
      processingVideos,
      creditsGranted,
      creditsUsed,
      creditsRefunded,
      paidPayments,
      promotionStats
    ] = await Promise.all([
      User.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({ status: { $ne: 'deleted' }, ...createdRange }),
      VideoProject.countDocuments(createdRange),
      VideoProject.countDocuments({ status: 'completed', ...createdRange }),
      VideoProject.countDocuments({ status: 'failed', ...createdRange }),
      VideoProject.countDocuments({ status: { $in: ['queued', 'processing', 'post_processing', 'uploading'] }, ...createdRange }),
      CreditTransaction.aggregate([
        { $match: { ...createdRange, type: { $in: ['purchase', 'manual_adjustment', 'promotion_bonus'] }, amount: { $gt: 0 } } },
        { $group: { _id: null, credits: { $sum: '$amount' } } }
      ]),
      CreditTransaction.aggregate([
        { $match: { ...createdRange, type: 'capture' } },
        { $group: { _id: null, credits: { $sum: '$amount' } } }
      ]),
      CreditTransaction.aggregate([
        { $match: { ...createdRange, type: { $in: ['release', 'refund'] } } },
        { $group: { _id: null, credits: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', ...paymentRange } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
      ]),
      PromotionRegistration.aggregate([
        { $match: createdRange },
        { $group: { _id: null, registrations: { $sum: 1 }, credits: { $sum: '$creditGranted' } } }
      ])
    ]);

    res.json({
      users: {
        total: totalUsers,
        new: newUsers
      },
      videos: {
        total: totalVideos,
        completed: completedVideos,
        failed: failedVideos,
        processing: processingVideos
      },
      credits: {
        granted: creditsGranted[0]?.credits || 0,
        used: creditsUsed[0]?.credits || 0,
        refunded: creditsRefunded[0]?.credits || 0
      },
      payments: {
        revenue: paidPayments[0]?.revenue || 0,
        successful: paidPayments[0]?.count || 0
      },
      promotions: {
        registrations: promotionStats[0]?.registrations || 0,
        creditsGranted: promotionStats[0]?.credits || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/reports/summary', async (req, res, next) => {
  try {
    const { days, since } = dateRangeFromQuery(req);
    const [
      totalUsers,
      newUsers,
      successfulVideos,
      failedVideos,
      paidPayments,
      creditsIssued,
      creditsUsed,
      promotionStats
    ] = await Promise.all([
      User.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({ createdAt: { $gte: since }, status: { $ne: 'deleted' } }),
      VideoProject.countDocuments({ status: 'completed', createdAt: { $gte: since } }),
      VideoProject.countDocuments({ status: 'failed', createdAt: { $gte: since } }),
      Payment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: since } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' }, credits: { $sum: '$credits' } } }
      ]),
      CreditTransaction.aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            type: { $in: ['purchase', 'manual_adjustment', 'promotion_bonus'] },
            amount: { $gt: 0 }
          }
        },
        { $group: { _id: null, credits: { $sum: '$amount' } } }
      ]),
      CreditTransaction.aggregate([
        { $match: { createdAt: { $gte: since }, type: 'capture' } },
        { $group: { _id: null, credits: { $sum: '$amount' } } }
      ]),
      PromotionRegistration.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$code', registrations: { $sum: 1 }, credits: { $sum: '$creditBonus' } } },
        { $sort: { registrations: -1 } }
      ])
    ]);

    res.json({
      report: {
        days,
        totalUsers,
        newUsers,
        successfulVideos,
        failedVideos,
        creditsIssued: creditsIssued[0]?.credits || 0,
        creditsUsed: creditsUsed[0]?.credits || 0,
        creditRevenue: paidPayments[0]?.revenue || 0,
        paidPayments: paidPayments[0]?.count || 0,
        purchasedCredits: paidPayments[0]?.credits || 0,
        promotionStats
      }
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/video-costs', async (req, res, next) => {
  try {
    const costs = await getVideoCostSettings();
    res.json({ costs });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/settings', async (req, res, next) => {
  try {
    const settings = await getSystemSettings();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/settings', async (req, res, next) => {
  try {
    const data = systemSettingsSchema.parse(req.body);
    const settings = await updateSystemSettings(data);

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_settings',
      resourceType: 'Setting',
      resourceId: 'system_settings',
      req,
      metadata: data
    });

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/video-costs', async (req, res, next) => {
  try {
    const data = videoCostSchema.parse(req.body);
    const costs = await updateVideoCostSettings(data);

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_video_costs',
      resourceType: 'Setting',
      resourceId: 'video_costs',
      req,
      metadata: data
    });

    res.json({ costs });
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

adminRoutes.patch('/content-reports/:id', async (req, res, next) => {
  try {
    const data = contentReportUpdateSchema.parse(req.body);
    const report = await ContentReport.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    })
      .populate('reporter', 'name email')
      .populate('project', 'title status');

    if (!report) {
      return res.status(404).json({ message: 'Khong tim thay report' });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_content_report',
      resourceType: 'ContentReport',
      resourceId: report._id.toString(),
      req,
      metadata: data
    });

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/videos', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const filter = { ...queryDateRange(req) };
    const includeDeleted = ['true', '1', 'yes'].includes(String(req.query.includeDeleted || '').toLowerCase());

    if (status === 'deleted') {
      filter.isDeleted = true;
    } else if (!includeDeleted) {
      filter.isDeleted = { $ne: true };
    }

    if (status && status !== 'deleted') {
      filter.status = status;
    }

    if (req.query.engine) {
      filter.generationMode = String(req.query.engine);
    }

    if (req.query.provider) {
      filter.provider = String(req.query.provider);
    }

    if (req.query.userId) {
      filter.user = String(req.query.userId);
    }

    if (search) {
      const userMatches = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { prompt: { $regex: search, $options: 'i' } },
        ...(mongoose.isValidObjectId(search) ? [{ _id: search }] : []),
        ...(userMatches.length ? [{ user: { $in: userMatches.map((user) => user._id) } }] : [])
      ];
    }

    const [videos, total] = await Promise.all([
      VideoProject.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      VideoProject.countDocuments(filter)
    ]);

    res.json({ videos, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/videos/:id', async (req, res, next) => {
  try {
    const [video, job] = await Promise.all([
      VideoProject.findById(req.params.id).populate('user', 'name email role status'),
      GenerationJob.findOne({ project: req.params.id }).sort({ createdAt: -1 })
    ]);

    if (!video) {
      return res.status(404).json({ message: 'Khong tim thay video' });
    }

    res.json({ video, job });
  } catch (error) {
    next(error);
  }
});

adminRoutes.delete('/videos/:id', async (req, res, next) => {
  try {
    const data = adminDeleteVideoSchema.parse(req.body || {});
    const video = await VideoProject.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Khong tim thay video' });
    }

    if (video.isDeleted) {
      return res.status(409).json({ message: 'Video da duoc xoa' });
    }

    if (!canDeleteVideo(video)) {
      return res.status(409).json({ message: 'Video dang duoc xu ly nen chua the xoa truc tiep' });
    }

    await softDeleteVideo({
      project: video,
      actor: req.user,
      actorRole: 'admin',
      action: 'admin.video.delete',
      reason: data.reason || 'Admin delete',
      req
    });

    res.json({ success: true, message: 'Video deleted by administrator' });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/pricing-plans', async (req, res, next) => {
  try {
    await seedDefaultPricingPlans();
    const plans = await PricingPlan.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/credit-packages', async (req, res, next) => {
  try {
    await seedDefaultPricingPlans();
    const plans = await PricingPlan.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json({ packages: plans, plans });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/pricing-plans', async (req, res, next) => {
  try {
    const data = pricingPlanSchema.parse(req.body);
    const plan = await PricingPlan.create({
      ...data,
      code: data.code.toLowerCase(),
      currency: data.currency.toUpperCase(),
      active: data.status ? data.status === 'active' : data.active
    });

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.create_pricing_plan',
      resourceType: 'PricingPlan',
      resourceId: plan._id.toString(),
      req
    });

    res.status(201).json({ plan });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/credit-packages', async (req, res, next) => {
  try {
    const data = pricingPlanSchema.parse(req.body);
    const plan = await PricingPlan.create({
      ...data,
      code: data.code.toLowerCase(),
      currency: data.currency.toUpperCase(),
      active: data.status ? data.status === 'active' : data.active
    });

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.create_credit_package',
      resourceType: 'PricingPlan',
      resourceId: plan._id.toString(),
      req
    });

    res.status(201).json({ package: plan, plan });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/pricing-plans/:id', async (req, res, next) => {
  try {
    const data = pricingPlanUpdateSchema.parse(req.body);
    const update = {
      ...data,
      ...(data.code ? { code: data.code.toLowerCase() } : {}),
      ...(data.currency ? { currency: data.currency.toUpperCase() } : {}),
      ...(data.status ? { active: data.status === 'active' } : {})
    };
    delete update.status;
    const plan = await PricingPlan.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!plan) {
      return res.status(404).json({ message: 'Khong tim thay goi credit' });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_pricing_plan',
      resourceType: 'PricingPlan',
      resourceId: plan._id.toString(),
      req,
      metadata: update
    });

    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/credit-packages/:id', async (req, res, next) => {
  try {
    const data = pricingPlanUpdateSchema.parse(req.body);
    const update = {
      ...data,
      ...(data.code ? { code: data.code.toLowerCase() } : {}),
      ...(data.currency ? { currency: data.currency.toUpperCase() } : {}),
      ...(data.status ? { active: data.status === 'active' } : {})
    };
    delete update.status;

    const plan = await PricingPlan.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!plan) {
      return res.status(404).json({ message: 'Khong tim thay goi credit' });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_credit_package',
      resourceType: 'PricingPlan',
      resourceId: plan._id.toString(),
      req,
      metadata: update
    });

    res.json({ package: plan, plan });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/credit-packages/:id/status', async (req, res, next) => {
  try {
    const data = statusSchema.parse(req.body);

    if (!['active', 'inactive'].includes(data.status)) {
      return res.status(400).json({ message: 'Trang thai goi credit khong hop le' });
    }

    const plan = await PricingPlan.findByIdAndUpdate(
      req.params.id,
      { active: data.status === 'active' },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Khong tim thay goi credit' });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_credit_package_status',
      resourceType: 'PricingPlan',
      resourceId: plan._id.toString(),
      req,
      metadata: data
    });

    res.json({ package: plan, plan });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/payments', async (req, res, next) => {
  try {
    const status = String(req.query.status || '').trim();
    const filter = { ...queryDateRange(req) };

    if (status) {
      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('package', 'code name credits price currency active')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ payments });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/promotions', async (req, res, next) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 }).limit(100);
    const registrations = await PromotionRegistration.aggregate([
      { $group: { _id: '$promotion', registrations: { $sum: 1 }, credits: { $sum: '$creditGranted' } } }
    ]);
    const stats = new Map(registrations.filter((item) => item._id).map((item) => [item._id.toString(), item]));

    res.json({
      promotions: promotions.map((promotion) => ({
        ...promotion.toObject(),
        stats: stats.get(promotion._id.toString()) || { registrations: 0, credits: 0 }
      }))
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/promotions', async (req, res, next) => {
  try {
    const data = promotionSchema.parse(req.body);
    const promotion = await Promotion.create(promotionPayload(data, req.user._id));

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.create_promotion',
      resourceType: 'Promotion',
      resourceId: promotion._id.toString(),
      req
    });

    res.status(201).json({ promotion });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/promotions/:id', async (req, res, next) => {
  try {
    const [promotion, registrations] = await Promise.all([
      Promotion.findById(req.params.id).populate('createdBy', 'name email'),
      PromotionRegistration.find({ promotion: req.params.id })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(100)
    ]);

    if (!promotion) {
      return res.status(404).json({ message: 'Khong tim thay promotion' });
    }

    res.json({ promotion, registrations });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/promotions/:id', async (req, res, next) => {
  try {
    const data = promotionUpdateSchema.parse(req.body);
    const update = promotionPayload(data);
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Khong tim thay promotion' });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_promotion',
      resourceType: 'Promotion',
      resourceId: promotion._id.toString(),
      req,
      metadata: update
    });

    res.json({ promotion });
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/promotions/:id/status', async (req, res, next) => {
  try {
    const data = statusSchema.parse(req.body);

    if (!['draft', 'active', 'inactive', 'expired'].includes(data.status)) {
      return res.status(400).json({ message: 'Trang thai promotion khong hop le' });
    }

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { status: data.status },
      { new: true, runValidators: true }
    );

    if (!promotion) {
      return res.status(404).json({ message: 'Khong tim thay promotion' });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'admin.update_promotion_status',
      resourceType: 'Promotion',
      resourceId: promotion._id.toString(),
      req,
      metadata: data
    });

    res.json({ promotion });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/promotions/:id/registrations', async (req, res, next) => {
  try {
    const registrations = await PromotionRegistration.find({ promotion: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    const totalCredit = registrations.reduce((sum, item) => sum + (item.creditGranted || item.creditBonus || 0), 0);

    res.json({ registrations, summary: { registrations: registrations.length, creditsGranted: totalCredit } });
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
