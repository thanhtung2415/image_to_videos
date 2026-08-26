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

async function transactionExists(idempotencyKey) {
  return CreditTransaction.findOne({ idempotencyKey });
}

async function createTransaction({ user, admin, project, job, type, amount, idempotencyKey, note, reason, balanceBefore }) {
  const exists = await CreditTransaction.findOne({ idempotencyKey });

  if (exists) {
    return exists;
  }

  return CreditTransaction.create({
    user: user._id,
    admin,
    project,
    job,
    type,
    amount,
    balanceBefore,
    balanceAfter: walletSnapshot(user),
    idempotencyKey,
    note,
    reason: reason || note || ''
  });
}

export async function reserveCredits({ userId, projectId, amount, idempotencyKey }) {
  const exists = await transactionExists(idempotencyKey);

  if (exists) {
    const currentUser = await User.findById(userId);
    return { ok: true, user: currentUser };
  }

  const beforeUser = await User.findById(userId);

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
    balanceBefore: beforeUser ? walletSnapshot(beforeUser) : undefined,
    note: 'Reserve credits for video generation'
  });

  return { ok: true, user };
}

export async function purchaseCredits({ userId, paymentId, amount, idempotencyKey }) {
  const exists = await transactionExists(idempotencyKey);

  if (exists) {
    return User.findById(userId);
  }

  const beforeUser = await User.findById(userId);
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
    balanceBefore: beforeUser ? walletSnapshot(beforeUser) : undefined,
    note: `Credit purchase from payment ${paymentId}`
  });

  return user;
}

export async function adjustCredits({ userId, adminId, delta, reason, idempotencyKey }) {
  const exists = await transactionExists(idempotencyKey);

  if (exists) {
    const currentUser = await User.findById(userId);
    return { ok: true, user: currentUser };
  }

  const beforeUser = await User.findById(userId);
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
    admin: adminId,
    type: 'manual_adjustment',
    amount: delta,
    idempotencyKey,
    balanceBefore: beforeUser ? walletSnapshot(beforeUser) : undefined,
    note: reason || `Manual credit adjustment by admin ${adminId}`,
    reason
  });

  return { ok: true, user };
}

export async function grantPromotionCredits({ userId, promotionId, code, amount, idempotencyKey }) {
  const exists = await transactionExists(idempotencyKey);

  if (exists) {
    return User.findById(userId);
  }

  const beforeUser = await User.findById(userId);
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
    type: 'promotion_bonus',
    amount,
    idempotencyKey,
    balanceBefore: beforeUser ? walletSnapshot(beforeUser) : undefined,
    note: `Promotion ${code} bonus from ${promotionId}`
  });

  return user;
}

export async function refundPurchasedCredits({ userId, paymentId, amount, idempotencyKey }) {
  const exists = await transactionExists(idempotencyKey);

  if (exists) {
    return User.findById(userId);
  }

  const beforeUser = await User.findById(userId);
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
    balanceBefore: beforeUser ? walletSnapshot(beforeUser) : undefined,
    note: `Credit refund from payment ${paymentId}`
  });

  return user;
}

export async function captureReservedCredits({ userId, projectId, jobId, amount, idempotencyKey }) {
  const exists = await transactionExists(idempotencyKey);

  if (exists) {
    return User.findById(userId);
  }

  const beforeUser = await User.findById(userId);
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
    balanceBefore: beforeUser ? walletSnapshot(beforeUser) : undefined,
    note: 'Capture reserved credits after completed generation'
  });

  return user;
}

export async function releaseReservedCredits({ userId, projectId, jobId, amount, idempotencyKey, note }) {
  const exists = await transactionExists(idempotencyKey);

  if (exists) {
    return User.findById(userId);
  }

  const beforeUser = await User.findById(userId);
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
    balanceBefore: beforeUser ? walletSnapshot(beforeUser) : undefined,
    note: note || 'Release reserved credits'
  });

  return user;
}
