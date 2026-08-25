import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { User } from '../models/User.js';
import { sendEmail } from './emailService.js';

function isNotificationEnabled(preference, type) {
  if (type.startsWith('VIDEO_')) {
    return preference.videoCompleted;
  }

  if (type.startsWith('PAYMENT_') || type.startsWith('CREDIT_')) {
    return preference.paymentEvents;
  }

  if (type === 'SECURITY_ALERT') {
    return preference.securityAlerts;
  }

  return true;
}

export async function notifyUser({ userId, type, title, message, metadata }) {
  const preference = await NotificationPreference.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true, new: true }
  );

  if (!isNotificationEnabled(preference, type)) {
    return null;
  }

  const notification = preference.inAppEnabled
    ? await Notification.create({
        user: userId,
        type,
        title,
        message,
        metadata
      })
    : null;

  if (preference.emailEnabled) {
    const user = await User.findById(userId);

    if (user) {
      await sendEmail({
        to: user.email,
        subject: title,
        text: message
      });
    }
  }

  return notification;
}
