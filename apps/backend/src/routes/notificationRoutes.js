import express from 'express';
import { z } from 'zod';
import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationRoutes = express.Router();

notificationRoutes.use(requireAuth);

const preferenceSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  browserEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  videoCompleted: z.boolean().optional(),
  paymentEvents: z.boolean().optional(),
  securityAlerts: z.boolean().optional()
});

notificationRoutes.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

notificationRoutes.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Khong tim thay thong bao' });
    }

    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

notificationRoutes.get('/preferences/me', async (req, res, next) => {
  try {
    const preferences = await NotificationPreference.findOneAndUpdate(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id } },
      { upsert: true, new: true }
    );

    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

notificationRoutes.patch('/preferences/me', async (req, res, next) => {
  try {
    const data = preferenceSchema.parse(req.body);
    const preferences = await NotificationPreference.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: data,
        $setOnInsert: { user: req.user._id }
      },
      { upsert: true, new: true }
    );

    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});
