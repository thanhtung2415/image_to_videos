import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import express from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { signAccessToken } from '../services/tokenService.js';
import { writeAuditLog } from '../services/auditService.js';
import { sendEmail } from '../services/emailService.js';
import { registerPromotionForUser, validatePromotionCode } from '../services/promotionService.js';

export const authRoutes = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(80),
  promotionCode: z.string().max(40).optional().default('')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(80)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(6).max(80)
});

const verifyEmailSchema = z.object({
  token: z.string().min(20).max(200)
});

function createTokenPair() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  return { token, tokenHash };
}

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

    if (data.promotionCode) {
      const promotionValidation = await validatePromotionCode(data.promotionCode);

      if (!promotionValidation.ok) {
        return res.status(promotionValidation.status).json({ message: promotionValidation.message });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const emailVerification = createTokenPair();
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: env.adminEmails.includes(data.email.toLowerCase()) ? 'admin' : 'user',
      emailVerificationTokenHash: emailVerification.tokenHash
    });

    await sendEmail({
      to: user.email,
      subject: 'Verify your Image To Videos account',
      text: `Verification token: ${emailVerification.token}`
    });

    await writeAuditLog({
      actor: user._id,
      action: 'auth.register',
      resourceType: 'User',
      resourceId: user._id.toString(),
      req
    });

    let registeredUser = user;

    if (data.promotionCode) {
      const promotionResult = await registerPromotionForUser({
        userId: user._id,
        code: data.promotionCode
      });

      if (!promotionResult.ok) {
        return res.status(promotionResult.status).json({ message: promotionResult.message });
      }

      registeredUser = promotionResult.user;

      await writeAuditLog({
        actor: user._id,
        action: 'promotion.register_on_signup',
        resourceType: 'Promotion',
        resourceId: promotionResult.promotion._id.toString(),
        req
      });
    }

    res.status(201).json({
      user: publicUser(registeredUser),
      token: signAccessToken(registeredUser)
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

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tai khoan dang bi khoa' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Tai khoan khong ton tai' });
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

authRoutes.post('/verify-email', async (req, res, next) => {
  try {
    const data = verifyEmailSchema.parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
    const user = await User.findOne({ emailVerificationTokenHash: tokenHash });

    if (!user) {
      return res.status(400).json({ message: 'Token xac minh khong hop le' });
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = '';
    await user.save();

    await writeAuditLog({
      actor: user._id,
      action: 'auth.verify_email',
      resourceType: 'User',
      resourceId: user._id.toString(),
      req
    });

    res.json({ verified: true });
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/forgot-password', async (req, res, next) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase(), status: 'active' });

    if (user) {
      const reset = createTokenPair();
      user.passwordResetTokenHash = reset.tokenHash;
      user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      await sendEmail({
        to: user.email,
        subject: 'Reset your Image To Videos password',
        text: `Password reset token: ${reset.token}`
      });
    }

    res.json({ sent: true });
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/reset-password', async (req, res, next) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      status: 'active'
    });

    if (!user) {
      return res.status(400).json({ message: 'Token reset khong hop le hoac da het han' });
    }

    user.passwordHash = await bcrypt.hash(data.password, 10);
    user.passwordResetTokenHash = '';
    user.passwordResetExpiresAt = undefined;
    await user.save();

    await writeAuditLog({
      actor: user._id,
      action: 'auth.reset_password',
      resourceType: 'User',
      resourceId: user._id.toString(),
      req
    });

    res.json({ reset: true });
  } catch (error) {
    next(error);
  }
});

authRoutes.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
