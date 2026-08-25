import express from 'express';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { Notification } from '../models/Notification.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { VideoProject } from '../models/VideoProject.js';
import { requireAuth } from '../middleware/auth.js';
import { writeAuditLog } from '../services/auditService.js';

export const accountRoutes = express.Router();

accountRoutes.use(requireAuth);

accountRoutes.get('/export', async (req, res, next) => {
  try {
    const [projects, payments, creditTransactions, notifications] = await Promise.all([
      VideoProject.find({ user: req.user._id }).sort({ createdAt: -1 }),
      Payment.find({ user: req.user._id }).sort({ createdAt: -1 }),
      CreditTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }),
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 })
    ]);

    await writeAuditLog({
      actor: req.user._id,
      action: 'account.export',
      resourceType: 'User',
      resourceId: req.user._id.toString(),
      req
    });

    res.json({
      exportedAt: new Date().toISOString(),
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        creditWallet: req.user.creditWallet
      },
      projects,
      payments,
      creditTransactions,
      notifications
    });
  } catch (error) {
    next(error);
  }
});

accountRoutes.delete('/', async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      status: 'deleted',
      deletedAt: new Date(),
      email: `deleted-${req.user._id}@deleted.local`,
      name: 'Deleted user'
    });

    await writeAuditLog({
      actor: req.user._id,
      action: 'account.delete',
      resourceType: 'User',
      resourceId: req.user._id.toString(),
      req
    });

    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

