import { CreditTransaction } from '../models/CreditTransaction.js';
import { User } from '../models/User.js';

function walletSnapshot(user) {
  return {
    availableCredit: user.creditWallet.availableCredit,
    reservedCredit: user.creditWallet.reservedCredit,
    lifetimePurchased: user.creditWallet.lifetimePurchased,
    lifetimeUsed: user.creditWallet.lifetimeUsed
  };
}

async function createTransaction({ user, project, job, type, amount, idempotencyKey, note }) {
  const exists = await CreditTransaction.findOne({ idempotencyKey });

  if (exists) {
    return exists;
  }

  return CreditTransaction.create({
    user: user._id,
    project,
    job,
    type,
    amount,
    balanceAfter: walletSnapshot(user),
    idempotencyKey,
    note
  });
}

export async function reserveCredits({ userId, projectId, amount, idempotencyKey }) {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      'creditWallet.availableCredit': { $gte: amount }
    },
    {
      $inc: {
        'creditWallet.availableCredit': -amount,
        'creditWallet.reservedCredit': amount
      }
    },
    { new: true }
  );

  if (!user) {
    return {
      ok: false,
      message: 'Khong du credit de tao video'
    };
  }

  await createTransaction({
    user,
    project: projectId,
    type: 'reserve',
    amount,
    idempotencyKey,
    note: 'Reserve credits for video generation'
  });

  return { ok: true, user };
}

export async function purchaseCredits({ userId, paymentId, amount, idempotencyKey }) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: {
        'creditWallet.availableCredit': amount,
        'creditWallet.lifetimePurchased': amount
      }
    },
    { new: true }
  );

  if (!user) {
    return null;
  }

  await createTransaction({
    user,
    type: 'purchase',
    amount,
    idempotencyKey,
    note: `Credit purchase from payment ${paymentId}`
  });

  return user;
}

export async function adjustCredits({ userId, adminId, delta, reason, idempotencyKey }) {
  const query = delta < 0
    ? {
        _id: userId,
        'creditWallet.availableCredit': { $gte: Math.abs(delta) }
      }
    : { _id: userId };

  const inc = {
    'creditWallet.availableCredit': delta
  };

  if (delta > 0) {
    inc['creditWallet.lifetimePurchased'] = delta;
  }

  const user = await User.findOneAndUpdate(
    query,
    { $inc: inc },
    { new: true }
  );

  if (!user) {
    return {
      ok: false,
      message: 'Khong the tru credit vuot qua so du hien co'
    };
  }

  await createTransaction({
    user,
    type: 'manual_adjustment',
    amount: delta,
    idempotencyKey,
    note: reason || `Manual credit adjustment by admin ${adminId}`
  });

  return { ok: true, user };
}

export async function refundPurchasedCredits({ userId, paymentId, amount, idempotencyKey }) {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      'creditWallet.availableCredit': { $gte: amount }
    },
    {
      $inc: {
        'creditWallet.availableCredit': -amount,
        'creditWallet.lifetimePurchased': -amount
      }
    },
    { new: true }
  );

  if (!user) {
    return null;
  }

  await createTransaction({
    user,
    type: 'refund',
    amount,
    idempotencyKey,
    note: `Credit refund from payment ${paymentId}`
  });

  return user;
}

export async function captureReservedCredits({ userId, projectId, jobId, amount, idempotencyKey }) {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      'creditWallet.reservedCredit': { $gte: amount }
    },
    {
      $inc: {
        'creditWallet.reservedCredit': -amount,
        'creditWallet.lifetimeUsed': amount
      }
    },
    { new: true }
  );

  if (!user) {
    return null;
  }

  await createTransaction({
    user,
    project: projectId,
    job: jobId,
    type: 'capture',
    amount,
    idempotencyKey,
    note: 'Capture reserved credits after completed generation'
  });

  return user;
}

export async function releaseReservedCredits({ userId, projectId, jobId, amount, idempotencyKey, note }) {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      'creditWallet.reservedCredit': { $gte: amount }
    },
    {
      $inc: {
        'creditWallet.availableCredit': amount,
        'creditWallet.reservedCredit': -amount
      }
    },
    { new: true }
  );

  if (!user) {
    return null;
  }

  await createTransaction({
    user,
    project: projectId,
    job: jobId,
    type: 'release',
    amount,
    idempotencyKey,
    note: note || 'Release reserved credits'
  });

  return user;
}
