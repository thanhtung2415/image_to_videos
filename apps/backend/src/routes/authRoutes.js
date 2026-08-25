import bcrypt from 'bcryptjs';
import express from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { signAccessToken } from '../services/tokenService.js';
import { writeAuditLog } from '../services/auditService.js';

export const authRoutes = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(80)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(80)
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

authRoutes.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: data.email });

    if (exists) {
      return res.status(409).json({ message: 'Email da duoc su dung' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash
    });

    await writeAuditLog({
      actor: user._id,
      action: 'auth.register',
      resourceType: 'User',
      resourceId: user._id.toString(),
      req
    });

    res.status(201).json({
      user: publicUser(user),
      token: signAccessToken(user)
    });
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email hoac mat khau khong dung' });
    }

    await writeAuditLog({
      actor: user._id,
      action: 'auth.login',
      resourceType: 'User',
      resourceId: user._id.toString(),
      req
    });

    res.json({
      user: publicUser(user),
      token: signAccessToken(user)
    });
  } catch (error) {
    next(error);
  }
});

authRoutes.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
