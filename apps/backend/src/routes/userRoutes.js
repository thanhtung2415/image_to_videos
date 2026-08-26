import bcrypt from 'bcryptjs';
import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { writeAuditLog } from '../services/auditService.js';

export const userRoutes = express.Router();

const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  fullName: z.string().min(2).max(80).optional(),
  avatar: z.string().url().max(500).optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6).max(80),
  newPassword: z.string().min(6).max(80)
});

function profileUser(user) {
  return {
    id: user._id,
    fullName: user.name,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar || '',
    creditWallet: user.creditWallet,
    createdAt: user.createdAt
  };
}

userRoutes.use(requireAuth);

userRoutes.get('/me', (req, res) => {
  res.json({ user: profileUser(req.user) });
});

userRoutes.patch('/me', async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const update = {};
    const nextName = data.fullName || data.name;

    if (nextName) {
      update.name = nextName;
    }

    if (data.avatar) {
      update.avatar = data.avatar;
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true
    }).select('-passwordHash -emailVerificationTokenHash -passwordResetTokenHash');

    await writeAuditLog({
      actor: req.user._id,
      action: 'users.update_me',
      resourceType: 'User',
      resourceId: req.user._id.toString(),
      req,
      metadata: update
    });

    res.json({ user: profileUser(user) });
  } catch (error) {
    next(error);
  }
});

userRoutes.patch('/me/password', async (req, res, next) => {
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
      action: 'users.change_password',
      resourceType: 'User',
      resourceId: req.user._id.toString(),
      req
    });

    res.json({ updated: true });
  } catch (error) {
    next(error);
  }
});
