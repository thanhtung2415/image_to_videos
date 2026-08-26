import express from 'express';
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
import { getVideoCostSettings, updateVideoCostSettings } from '../services/settingService.js';
import { writeAuditLog } from '../services/auditService.js';

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
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'locked']).optional()
});

const creditAdjustmentSchema = z.object({
  amount: z.coerce.number().int().refine((value) => value !== 0, 'Amount must not be zero'),
  reason: z.string().max(200).default('')
});

const promotionSchema = z.object({
  name: z.string().min(3).max(120),
  code: z.string().min(3).max(40),
  description: z.string().max(300).default(''),
  creditBonus: z.coerce.number().int().min(1),
  maxRegistrations: z.coerce.number().int().min(0).default(0),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(['active', 'inactive']).default('active'),
  conditions: z.string().max(300).default('One registration per user')
});

const promotionUpdateSchema = promotionSchema.partial();

const pricingPlanSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  credits: z.coerce.number().int().min(0),
  price: z.coerce.number().min(0),
  currency: z.string().min(3).max(3).default('VND'),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0)
});

const pricingPlanUpdateSchema = pricingPlanSchema.partial();

const videoCostSchema = z.object({
  ffmpegBaseCredits: z.coerce.number().int().min(0).optional(),
  aiDefaultBaseCredits: z.coerce.number().int().min(0).optional(),
  extraSecondCredits: z.coerce.number().int().min(0).optional(),
  modelCredits: z.record(z.string(), z.coerce.number().int().min(0)).optional()
});

function dateRangeFromQuery(req) {
  const days = Math.min(365, Math.max(1, Number(req.query.days || 30)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return { days, since };
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
    const filter = search
      ? {
          status: { $ne: 'deleted' },
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : { status: { $ne: 'deleted' } };

    const users = await User.find(filter)
      .select('-passwordHash -emailVerificationTokenHash -passwordResetTokenHash')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ users: users.map(adminUser) });
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
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'deleted' } },
      data,
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
      metadata: data
    });

    res.json({ user: adminUser(user) });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/users/:id/credits', async (req, res, next) => {
  try {
    const data = creditAdjustmentSchema.parse(req.body);
    const result = await adjustCredits({
      userId: req.params.id,
      adminId: req.user._id,
      delta: data.amount,
      reason: data.reason,
      idempotencyKey: `admin-credit:${req.user._id}:${req.params.id}:${Date.now()}`
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

adminRoutes.get('/videos', async (req, res, next) => {
  try {
    const status = String(req.query.status || '').trim();
    const filter = status ? { status } : {};
    const videos = await VideoProject.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ videos });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/pricing-plans', async (req, res, next) => {
  try {
    const plans = await PricingPlan.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json({ plans });
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
      currency: data.currency.toUpperCase()
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

adminRoutes.patch('/pricing-plans/:id', async (req, res, next) => {
  try {
    const data = pricingPlanUpdateSchema.parse(req.body);
    const update = {
      ...data,
      ...(data.code ? { code: data.code.toLowerCase() } : {}),
      ...(data.currency ? { currency: data.currency.toUpperCase() } : {})
    };
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

adminRoutes.get('/payments', async (req, res, next) => {
  try {
    const status = String(req.query.status || '').trim();
    const filter = status ? { status } : {};
    const payments = await Payment.find(filter)
      .populate('user', 'name email')
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
      { $group: { _id: '$promotion', registrations: { $sum: 1 }, credits: { $sum: '$creditBonus' } } }
    ]);
    const stats = new Map(registrations.map((item) => [item._id.toString(), item]));

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
    const promotion = await Promotion.create({
      ...data,
      code: data.code.toUpperCase(),
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt)
    });

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

adminRoutes.patch('/promotions/:id', async (req, res, next) => {
  try {
    const data = promotionUpdateSchema.parse(req.body);
    const update = {
      ...data,
      ...(data.code ? { code: data.code.toUpperCase() } : {}),
      ...(data.startsAt ? { startsAt: new Date(data.startsAt) } : {}),
      ...(data.endsAt ? { endsAt: new Date(data.endsAt) } : {})
    };
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
