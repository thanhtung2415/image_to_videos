import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export const secureHeaders = helmet({
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 3000,
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 300,
  standardHeaders: true,
  legacyHeaders: false
});
