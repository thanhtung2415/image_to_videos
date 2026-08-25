import express from 'express';
import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationRoutes = express.Router();

notificationRoutes.use(requireAuth);

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

