import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { Notification } from '../models/Notification.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { VideoProject } from '../models/VideoProject.js';
import { requireAuth } from '../middleware/auth.js';
import { writeAuditLog } from '../services/auditService.js';

export const accountRoutes = express.Router();

const profileSchema = z.object({
  name: z.string().min(2).max(80)
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6).max(80),
  newPassword: z.string().min(6).max(80)
});

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    creditWallet: user.creditWallet
  };
}

accountRoutes.use(requireAuth);

accountRoutes.patch('/profile', async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: data.name },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    await writeAuditLog({
      actor: req.user._id,
      action: 'account.update_profile',
      resourceType: 'User',
      resourceId: req.user._id.toString(),
      req
    });

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

accountRoutes.patch('/password', async (req, res, next) => {
  try {
    const data = passwordSchema.parse(req.body);
    const user = await User.findById(req.user._id);

    if (!user || !(await bcrypt.compare(data.currentPassword, user.passwordHash))) {
      return res.status(400).json({ message: 'Mat khau hien tai khong dung' });
    }

    user.passwordHash = await bcrypt.hash(data.newPassword, 10);
    await user.save();

    await writeAuditLog({
      actor: req.user._id,
      action: 'account.change_password',
      resourceType: 'User',
      resourceId: req.user._id.toString(),
      req
    });

    res.json({ updated: true });
  } catch (error) {
    next(error);
  }
});

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
