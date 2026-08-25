import express from 'express';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { requireAuth } from '../middleware/auth.js';

export const creditRoutes = express.Router();

creditRoutes.use(requireAuth);

creditRoutes.get('/wallet', async (req, res) => {
  res.json({
    wallet: req.user.creditWallet
  });
});

creditRoutes.get('/transactions', async (req, res, next) => {
  try {
    const transactions = await CreditTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});

