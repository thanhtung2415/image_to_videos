import express from 'express';
import { listActivePlans } from '../services/pricingService.js';

export const pricingRoutes = express.Router();

pricingRoutes.get('/plans', async (req, res, next) => {
  try {
    const plans = await listActivePlans();
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

